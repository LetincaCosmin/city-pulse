import { Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://pulsecity.ro";
const siteName = "Pulse City";
const siteDescription =
  "Pulse City este platforma locala pentru Resita: evenimente, business-uri, oferte, harta live si noutati din oras.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "Pulse City | Evenimente si business-uri locale in Resita",
    template: "%s | Pulse City",
  },
  description: siteDescription,
  keywords: [
    "Pulse City",
    "pulsecity.ro",
    "Resita",
    "evenimente Resita",
    "business-uri Resita",
    "localuri Resita",
    "oferte Resita",
    "harta Resita",
    "orasul Resita",
  ],
  authors: [{ name: "Pulse City" }],
  creator: "Pulse City",
  publisher: "Pulse City",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
  verification: {
    google: "ppkD68p4KpHXMOjJ4DaTTBY1PFp9K6ihedXxCEQqNPo",
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: siteUrl,
    siteName,
    title: "Pulse City | Evenimente si business-uri locale in Resita",
    description: siteDescription,
    images: [
      {
        url: "/images/resita-bg.png",
        width: 1200,
        height: 630,
        alt: "Pulse City Resita",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse City | Evenimente si business-uri locale in Resita",
    description: siteDescription,
    images: ["/images/resita-bg.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Pulse City",
  },
  category: "local",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body
        className={`${inter.className} bg-[#09090b] text-white antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
