import { CallToAction } from "@/components/CallToAction";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import { Insights } from "@/components/Insights";
import { SocialProof } from "@/components/SocialProof";
import { PageShell } from "@/components/layout/PageShell";

/**
 * Landing page — Sonar Bangla Poster AI.
 * Composes the marketing sections inside the shared page chrome.
 */
export default function Home() {
  return (
    <PageShell>
      <Hero />
      <SocialProof />
      <Features />
      <Insights />
      <CallToAction />
    </PageShell>
  );
}
