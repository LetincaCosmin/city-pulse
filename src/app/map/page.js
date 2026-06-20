import MapPageClient from "@/components/MapPageClient";

export const metadata = {
  title: "Harta live Resita",
  description:
    "Exploreaza Resita pe harta live Pulse City: localuri, servicii, evenimente, lansari si magazine din oras.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/map",
  },
  openGraph: {
    title: "Harta live Resita | Pulse City",
    description:
      "Exploreaza localuri, servicii, evenimente si business-uri din Resita pe harta live.",
    url: "/map",
    images: ["/images/resita-bg.png"],
  },
};

export default function MapPage() {
  return <MapPageClient />;
}
