import Link from "next/link";
import { MapPin, Search, Star, Store } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { businesses } from "@/data/businesses";
import { showDemoContent } from "@/data/demo";
import { calculateBusinessReviewSummary } from "@/lib/businessReviews";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business-uri locale in Resita",
  description:
    "Descopera business-uri locale din Resita: localuri, servicii, magazine, oferte si pagini actualizate de antreprenori locali.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/business",
  },
  openGraph: {
    title: "Business-uri locale in Resita | Pulse City",
    description:
      "Descopera business-uri locale din Resita: localuri, servicii, magazine si oferte.",
    url: "/business",
    images: ["/images/resita-bg.png"],
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function normalizeBusiness(business) {
  return {
    id: business.id,
    name: business.name,
    category: business.category || "Business local",
    status: "Deschis",
    rating: business.rating || "Nou",
    reviews: business.reviews || 0,
    cover: business.image_url || business.cover || "/images/resita-bg.png",
    logoUrl: business.logo_url || business.logoUrl || null,
    logo:
      business.logo ||
      business.name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 4)
        .toUpperCase() ||
      "CP",
    address: business.location_name || business.address || "Resita",
  };
}

async function getBusinessList() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare la incarcarea business-urilor:", error.message);
    return showDemoContent ? businesses.map(normalizeBusiness) : [];
  }

  const liveBusinesses = (data || []).map(normalizeBusiness);
  const liveBusinessIds = liveBusinesses.map((business) => business.id);
  let reviewMap = new Map();

  if (liveBusinessIds.length > 0) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from("business_reviews")
      .select("business_id, rating")
      .in("business_id", liveBusinessIds);

    if (reviewError) {
      console.error(
        "Eroare la incarcarea ratingurilor business-urilor:",
        reviewError.message,
      );
    } else {
      reviewMap = (reviewRows || []).reduce((map, review) => {
        const currentReviews = map.get(review.business_id) || [];
        currentReviews.push(review);
        map.set(review.business_id, currentReviews);
        return map;
      }, new Map());
    }
  }

  const liveBusinessesWithReviews = liveBusinesses.map((business) => {
    const summary = calculateBusinessReviewSummary(
      reviewMap.get(business.id) || [],
      business,
    );

    return {
      ...business,
      rating: summary.ratingLabel,
      reviews: summary.reviewCount,
    };
  });

  const mockBusinesses = businesses.map(normalizeBusiness);
  const liveIds = new Set(
    liveBusinessesWithReviews.map((business) => business.id),
  );
  const fallbackMocks = showDemoContent
    ? mockBusinesses.filter((business) => !liveIds.has(business.id))
    : [];

  return [...liveBusinessesWithReviews, ...fallbackMocks];
}

export default async function BusinessListPage() {
  const businessList = await getBusinessList();

  return (
    <div className="px-4 pb-10 pt-6 sm:px-5">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#ff003c]">
          City Discovery
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Business-uri locale
        </h1>
        <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-zinc-500">
          Cafenele, restaurante, magazine si servicii locale din Resita.
        </p>
      </header>

      <div
        className="mb-5 flex h-[52px] items-center gap-3 rounded-2xl px-4"
        style={{
          backgroundColor: "#101014",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        <Search size={18} className="text-zinc-500" />
        <span className="text-sm font-light text-zinc-500">
          Cauta business-uri...
        </span>
      </div>

      <section className="space-y-4">
        {businessList.length > 0 ? (
          businessList.map((business) => (
            <Link
              key={business.id}
              href={`/business/${business.id}`}
              className="relative block overflow-hidden rounded-3xl"
              style={{
                backgroundColor: "#101014",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.38)",
              }}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={business.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(255,0,60,0.38),transparent_30%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                <div className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-black/70 text-sm font-semibold text-[#ff003c] ring-1 ring-[#ff003c]/65">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    business.logo
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {business.name}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {business.category}
                    </p>
                  </div>
                  <Store size={18} className="mt-1 shrink-0 text-[#ff003c]" />
                </div>

                <div className="mt-3 grid gap-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Star
                      size={13}
                      className="text-amber-300"
                      fill="currentColor"
                    />
                    {business.rating} ({business.reviews}) - {business.status}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#ff003c]" />
                    {business.address}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm font-light text-zinc-500">
              Nu exista business-uri publicate momentan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
