import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: {
    absolute: "Pulse City | Evenimente si business-uri locale in Resita",
  },
  description:
    "Descopera ce se intampla in Resita: evenimente, business-uri locale, oferte, harta live si noutati publicate de comunitate.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Pulse City | Evenimente si business-uri locale in Resita",
    description:
      "Evenimente, business-uri locale, oferte si noutati din Resita intr-un singur loc.",
    url: "/",
    images: ["/images/resita-bg.png"],
  },
};

export default function Home() {
  return <HomePageClient />;
}
