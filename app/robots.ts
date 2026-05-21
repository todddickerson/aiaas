import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Pre-alpha: discourage crawling of the buyer-only surfaces until
        // we cut over to aiaas.com on Day 12. SEO-facing routes (/, /agents,
        // /managers, /portfolio, /trust, /how-it-works, /manifesto,
        // /developers) are explicitly indexed by being absent from the
        // disallow list below.
        disallow: ["/dashboard", "/publish", "/runs", "/api"],
      },
    ],
    sitemap: "https://aiaas.com/sitemap.xml",
  };
}
