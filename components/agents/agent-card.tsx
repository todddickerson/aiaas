import { CardEditorial } from "@/components/agents/card-editorial";
import { CardGamified } from "@/components/agents/card-gamified";
import { CardSwiss } from "@/components/agents/card-swiss";
import { CardTerminal } from "@/components/agents/card-terminal";
import type { Agent, Variant } from "@/lib/types";

export interface AgentCardProps {
  agent: Agent;
  variant?: Variant;
}

export function AgentCard({ agent, variant = "editorial" }: AgentCardProps) {
  if (variant === "gamified") return <CardGamified agent={agent} />;
  if (variant === "swiss") return <CardSwiss agent={agent} />;
  if (variant === "terminal") return <CardTerminal agent={agent} />;
  return <CardEditorial agent={agent} />;
}
