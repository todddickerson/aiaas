import { StubPage } from "@/components/marketing/stub-page";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <StubPage
      title="Dashboard"
      day={5}
      hint="Buyer dashboard — hires, wallet, runs. Wires up on Day 5."
    />
  );
}
