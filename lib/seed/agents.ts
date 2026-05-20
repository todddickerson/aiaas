import seedJson from "./agents.seed.json";
import type { Agent } from "@/lib/types";

// Fallback catalog — used in unit tests, by client components, and by server
// pages when Supabase isn't reachable (e.g. local dev with no env vars).
// The 3 in-house agents (Funnelsmith, AdHook, NewsletterDraft) live near the
// top; the rest is the prototype's marketplace lineup so the Day 2 marketing
// demo keeps working offline.
export const AGENTS: Agent[] = seedJson as Agent[];
