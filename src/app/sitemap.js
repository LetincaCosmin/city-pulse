import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const fallbackSiteUrl = "https://pulsecity.ro";

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    fallbackSiteUrl;

  const url = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return url.replace(/\/$/, "");
}

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function createUrl(path, options = {}) {
  return {
    url: `${getSiteUrl()}${path}`,
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency || "weekly",
    priority: options.priority || 0.7,
  };
}

async function getDynamicUrls() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return [];
  }

  const [businessesResult, eventsResult] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("id, updated_at, created_at")
      .order("event_date", { ascending: false })
      .limit(500),
  ]);

  if (businessesResult.error) {
    console.error("Eroare la generarea sitemap business:", businessesResult.error.message);
  }

  if (eventsResult.error) {
    console.error("Eroare la generarea sitemap evenimente:", eventsResult.error.message);
  }

  const businessUrls = (businessesResult.data || []).map((business) =>
    createUrl(`/business/${business.id}`, {
      lastModified: business.updated_at || business.created_at,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const eventUrls = (eventsResult.data || []).map((event) =>
    createUrl(`/events/${event.id}`, {
      lastModified: event.updated_at || event.created_at,
      changeFrequency: "weekly",
      priority: 0.75,
    }),
  );

  return [...businessUrls, ...eventUrls];
}

export default async function sitemap() {
  const staticUrls = [
    createUrl("/", { changeFrequency: "daily", priority: 1 }),
    createUrl("/business", { changeFrequency: "daily", priority: 0.9 }),
    createUrl("/events", { changeFrequency: "daily", priority: 0.9 }),
    createUrl("/map", { changeFrequency: "weekly", priority: 0.8 }),
    createUrl("/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    createUrl("/terms", { changeFrequency: "yearly", priority: 0.3 }),
    createUrl("/cookies", { changeFrequency: "yearly", priority: 0.3 }),
  ];

  return [...staticUrls, ...(await getDynamicUrls())];
}
