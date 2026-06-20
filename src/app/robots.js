const siteUrl = "https://pulsecity.ro";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/business", "/events", "/map", "/privacy", "/terms", "/cookies"],
        disallow: ["/dashboard", "/profile", "/login", "/setup-profile", "/reset-password"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
