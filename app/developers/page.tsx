import { StubPage } from "@/components/marketing/stub-page";

export const metadata = { title: "Developers" };

export default function DevelopersPage() {
  return (
    <StubPage
      title="Developers"
      day={8}
      hint="API contract + webhook spec. The runtime-side surface."
    />
  );
}
