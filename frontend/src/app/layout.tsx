import type { Metadata, Viewport } from "next";
import {
  Hind_Siliguri,
  Noto_Serif_Bengali,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoBengali = Noto_Serif_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Sonar Bangla Poster AI — AI Political Poster Maker",
  description:
    "Create pixel-perfect Bangladeshi political posters — Victory Day, tributes, election campaigns and greetings — with AI-assisted layouts and precise Bangla typography.",
  keywords: [
    "AI Political Poster Maker",
    "Sonar Bangla Poster AI",
    "Victory Day poster",
    "Election campaign poster",
    "Bangladesh poster generator",
    "Bangla typography",
  ],
  openGraph: {
    title: "Sonar Bangla Poster AI — AI Political Poster Maker",
    description:
      "AI-assisted Bangladeshi political poster generator with precise Bangla text rendering.",
    type: "website",
    siteName: "Sonar Bangla Poster AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonar Bangla Poster AI — AI Political Poster Maker",
    description:
      "AI-assisted Bangladeshi political poster generator with precise Bangla text rendering.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${hindSiliguri.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="bg-ink text-white min-h-full flex flex-col font-sans overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
