import { NextRequest, NextResponse } from "next/server";

/**
 * Alpha gate middleware.
 *
 * Per Todd's deployment posture (2026-05-20): the app stays on a Vercel
 * subdomain through alpha launch. Public marketplace pages and our public
 * API must NOT be visible until cutover. Anyone hitting the site must
 * present the alpha token (cookie or `?alpha=<token>` query) or see the
 * minimal `/gate` interstitial.
 *
 * Bypassed routes (always public):
 *   • /api/health           — Cloudflare + external monitors probe this
 *   • /api/v1/*             — the public buyer/builder API (already auth'd
 *                              by Supabase RLS once Supabase is wired)
 *   • /gate, /_next/*,
 *     /favicon.ico,
 *     /sitemap.xml,
 *     /robots.txt           — the gate itself + static assets
 *
 * Enable by setting AIAAS_ALPHA_TOKEN in the deployment environment.
 * If unset, the gate is disabled (open dev mode) so local testing keeps
 * working.
 */

const COOKIE_NAME = "aiaas-alpha-pass";
const COOKIE_DAYS = 30;

const BYPASS_PATHS = [
  "/api/health",
  "/api/v1/",
  "/gate",
  "/_next/",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
];

export function middleware(request: NextRequest): NextResponse {
  const token = process.env.AIAAS_ALPHA_TOKEN;
  if (!token) return NextResponse.next();

  const { pathname, searchParams } = request.nextUrl;
  for (const prefix of BYPASS_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie === token) return NextResponse.next();

  // `?alpha=<token>` lets us share a one-shot URL: visiting it sets the
  // cookie and 302s back to the requested path.
  const queryToken = searchParams.get("alpha");
  if (queryToken === token) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("alpha");
    const res = NextResponse.redirect(clean);
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_DAYS * 24 * 60 * 60,
      path: "/",
    });
    return res;
  }

  // Send everyone else to the gate page with the original destination so
  // a successful entry returns them where they were going.
  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/gate";
  gateUrl.searchParams.set("next", pathname);
  return NextResponse.rewrite(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
