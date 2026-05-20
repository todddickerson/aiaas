import { Footer } from "@/components/marketing/footer";
import { TopNav } from "@/components/marketing/top-nav";
import { PublishWizard } from "@/components/publish/publish-wizard";

export const metadata = {
  title: "Publish an agent · AIaaS",
  description:
    "Onboard your agent in five steps — name + tagline, English spec, runtime + destinations, Whop payee, review.",
};

export default function PublishPage() {
  return (
    <>
      <TopNav />
      <main className="bg-background">
        <PublishWizard />
      </main>
      <Footer />
    </>
  );
}
