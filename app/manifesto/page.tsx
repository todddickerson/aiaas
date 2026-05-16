import { StubPage } from "@/components/marketing/stub-page";

export const metadata = { title: "Manifesto" };

export default function ManifestoPage() {
  return (
    <StubPage
      title="Manifesto"
      day={2}
      hint="The runtime-agnostic, operator-UX-first thesis. Ports from pages.jsx."
    />
  );
}
