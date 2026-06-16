import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  Clock,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import { businesses, getBusinessById } from "@/data/businesses";
import { showDemoContent } from "@/data/demo";
import { normalizeEvent } from "@/data/events";
import BusinessReviewsSection from "@/components/BusinessReviewsSection";
import {
  calculateBusinessReviewSummary,
  getAuthorInitial,
} from "@/lib/businessReviews";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeBusiness(business) {
  return {
    id: business.id,
    name: business.name,
    category: business.category || "Business local",
    status: business.status || "Deschis",
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
    phone: business.phone || "Telefon necompletat",
    instagram: business.instagram || "Instagram necompletat",
    website: business.website || "Website necompletat",
    schedule: business.schedule || "Program necompletat",
    description:
      business.description ||
      business.subtitle ||
      "Acest business este nou pe City Pulse. Mai multe detalii vor fi adaugate in curand.",
    vibe: business.vibe || [business.category || "local"],
    offers: business.offers || ["Nicio oferta activa momentan"],
    events: business.events || ["Niciun eveniment anuntat momentan"],
    gallery: business.gallery || ["Cover", "Locatie", "Atmosfera"],
  };
}

async function getBusiness(id) {
  const mockBusiness = getBusinessById(id);
  const isUuid = UUID_PATTERN.test(id);

  if (!isUuid) {
    return showDemoContent && mockBusiness
      ? normalizeBusiness(mockBusiness)
      : undefined;
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Eroare la incarcarea business-ului:", error.message);
  }

  return data
    ? normalizeBusiness(data)
    : showDemoContent && mockBusiness
      ? normalizeBusiness(mockBusiness)
      : undefined;
}

function splitPostText(text = "") {
  const [firstLine, ...rest] = text.split("\n").filter(Boolean);
  return {
    title: firstLine || "Update local",
    body: rest.join("\n") || text,
  };
}

async function getBusinessPosts(business) {
  if (!business?.id && !business?.name) return [];

  const postsById = [];

  if (UUID_PATTERN.test(business.id)) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(
        "Eroare la incarcarea postarilor dupa business_id:",
        error.message,
      );
    } else {
      postsById.push(...(data || []));
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("business_name", business.name)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Eroare la incarcarea postarilor business:", error.message);
    return postsById;
  }

  const postsByName = data || [];
  const seen = new Set();

  return [...postsById, ...postsByName]
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .slice(0, 5);
}

async function getBusinessEvents(business) {
  if (!UUID_PATTERN.test(business.id)) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("business_id", business.id)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Eroare la incarcarea evenimentelor business:", error.message);
    return [];
  }

  return (data || []).map(normalizeEvent);
}

async function getBusinessReviewsData(business) {
  const fallbackSummary = calculateBusinessReviewSummary([], business);

  if (!UUID_PATTERN.test(business.id)) {
    return {
      reviews: [],
      summary: fallbackSummary,
      isLiveBusiness: false,
    };
  }

  const { data, error } = await supabase
    .from("business_reviews")
    .select("id, business_id, user_id, rating, comment, created_at, updated_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare la incarcarea recenziilor business:", error.message);
    return {
      reviews: [],
      summary: fallbackSummary,
      isLiveBusiness: true,
    };
  }

  const reviews = data || [];
  const userIds = [...new Set(reviews.map((review) => review.user_id).filter(Boolean))];

  let profileMap = new Map();

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Eroare la incarcarea autorilor recenziilor:",
        profilesError.message,
      );
    } else {
      profileMap = new Map((profilesData || []).map((profile) => [profile.id, profile]));
    }
  }

  return {
    reviews: reviews.map((review) => {
      const profile = profileMap.get(review.user_id);
      const authorName = profile?.name || "Utilizator City Pulse";

      return {
        ...review,
        authorName,
        authorAvatarUrl: profile?.avatar_url || null,
        authorInitial: getAuthorInitial(authorName),
      };
    }),
    summary: calculateBusinessReviewSummary(reviews, business),
    isLiveBusiness: true,
  };
}

export function generateStaticParams() {
  return showDemoContent ? businesses.map((business) => ({ id: business.id })) : [];
}

export default async function BusinessPage({ params }) {
  const { id } = await params;
  const business = await getBusiness(id);

  if (!business) {
    notFound();
  }

  const recentPosts = await getBusinessPosts(business);
  const businessEvents = await getBusinessEvents(business);
  const reviewData = await getBusinessReviewsData(business);
  const businessWithReviews = {
    ...business,
    rating: reviewData.summary.ratingLabel,
    reviews: reviewData.summary.reviewCount,
  };

  return (
    <div className="pb-10">
      <header className="relative h-[310px] overflow-hidden">
        <img
          src={businessWithReviews.cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_20%,rgba(255,0,60,0.38),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/45 to-black/25" />

        <div className="absolute left-5 right-5 top-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15"
          >
            <ArrowLeft size={18} />
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15">
            <Share2 size={18} />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-4 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-black/70 text-lg font-semibold tracking-wide text-[#ff003c] ring-1 ring-[#ff003c]/75">
              {businessWithReviews.logoUrl ? (
                <img
                  src={businessWithReviews.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                businessWithReviews.logo
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold leading-tight text-white">
                  {businessWithReviews.name}
                </h1>
                <span className="h-2 w-2 rounded-full bg-[#ff003c]" />
              </div>
              <p className="text-sm text-zinc-300">{businessWithReviews.category}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-amber-300">
                  <Star size={14} fill="currentColor" />
                  {businessWithReviews.rating}
                  <span className="text-zinc-500">({businessWithReviews.reviews})</span>
                </span>
                <span className="text-emerald-400">{businessWithReviews.status}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-5">
        <section className="mb-6 grid grid-cols-4 gap-3">
          {[
            [Phone, "Suna"],
            [MessageCircle, "Mesaj"],
            [Heart, "Salveaza"],
            [Share2, "Distribuie"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[#101014] text-zinc-400 ring-1 ring-white/10"
            >
              <Icon size={18} className="text-white" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </section>

        <section
          className="mb-6 rounded-3xl p-4"
          style={{
            backgroundColor: "#101014",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          }}
        >
          <div className="grid gap-3 text-sm text-zinc-400">
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Clock size={15} className="text-[#ff003c]" />
                Program
              </span>
              <span className="text-zinc-200">{businessWithReviews.schedule}</span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <MapPin size={15} className="text-[#ff003c]" />
                Adresa
              </span>
              <span className="max-w-[60%] text-right text-zinc-200">
                {businessWithReviews.address}
              </span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <AtSign size={15} className="text-[#ff003c]" />
                Instagram
              </span>
              <span className="text-zinc-200">{businessWithReviews.instagram}</span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Globe size={15} className="text-[#ff003c]" />
                Website
              </span>
              <span className="text-zinc-200">{businessWithReviews.website}</span>
            </span>
          </div>
        </section>

        <nav className="-mx-4 mb-6 flex gap-6 overflow-x-auto border-b border-white/10 px-4 no-scrollbar sm:-mx-5 sm:px-5">
          {["Despre", "Oferte", "Evenimente", "Recenzii", "Poze"].map(
            (tab, index) => (
              <button
                key={tab}
                className={`relative h-11 shrink-0 text-xs ${
                  index === 0 ? "text-[#ff003c]" : "text-zinc-500"
                }`}
              >
                {tab}
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#ff003c]" />
                )}
              </button>
            ),
          )}
        </nav>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-white">Despre</h2>
          <p className="text-sm font-light leading-relaxed text-zinc-400">
            {businessWithReviews.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {businessWithReviews.vibe.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#ff003c]/10 px-3 py-1 text-[11px] text-[#ff003c] ring-1 ring-[#ff003c]/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Postari recente
            </h2>
            <span className="text-[11px] text-zinc-500">
              {recentPosts.length} active
            </span>
          </div>

          {recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => {
                const postText = splitPostText(post.text);
                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl bg-[#101014] ring-1 ring-white/10"
                  >
                    <div className="p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-md border border-[#ff003c]/30 bg-[#ff003c]/10 px-2 py-1 text-[9px] font-medium tracking-wider text-[#ff003c]">
                          {post.tag || "#Update"}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          recent
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">
                        {postText.title}
                      </h3>
                      {postText.body && (
                        <p className="mt-2 text-xs font-light leading-relaxed text-zinc-400">
                          {postText.body}
                        </p>
                      )}
                    </div>
                    {post.image && (
                      <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10">
                        <img
                          src={post.image}
                          alt={postText.title}
                          className="block h-auto max-h-[380px] w-full object-contain"
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm font-light text-zinc-500">
              Business-ul nu are postari publicate inca.
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Oferte</h2>
            <span className="text-[11px] text-zinc-500">Active acum</span>
          </div>
          <div className="space-y-3">
            {businessWithReviews.offers.map((offer) => (
              <div
                key={offer}
                className="rounded-2xl bg-[#101014] p-4 ring-1 ring-white/10"
              >
                <p className="text-sm font-semibold text-white">{offer}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Disponibil pentru clientii City Pulse.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-white">
            Evenimente
          </h2>
          <div className="space-y-3">
            {businessEvents.length > 0
              ? businessEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#101014] px-4 py-3 ring-1 ring-white/10"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">
                        {event.title}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Clock size={12} className="text-[#ff003c]" />
                        {event.fullDate} - {event.time}
                      </span>
                    </span>
                    <CalendarDays size={16} className="shrink-0 text-[#ff003c]" />
                  </Link>
                ))
              : businessWithReviews.events.map((event) => (
                  <div
                    key={event}
                    className="flex items-center justify-between rounded-2xl bg-[#101014] px-4 py-3 ring-1 ring-white/10"
                  >
                    <span className="text-sm text-white">{event}</span>
                    <CalendarDays size={16} className="text-[#ff003c]" />
                  </div>
                ))}
          </div>
        </section>

        <BusinessReviewsSection
          businessId={businessWithReviews.id}
          businessName={businessWithReviews.name}
          businessOwnerId={businessWithReviews.id}
          initialReviews={reviewData.reviews}
          fallbackSummary={{
            rating: business.rating,
            reviews: business.reviews,
          }}
          isLiveBusiness={reviewData.isLiveBusiness}
        />

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">Poze</h2>
          <div className="grid grid-cols-3 gap-3">
            {businessWithReviews.gallery.map((item) => (
              <div
                key={item}
                className="relative h-24 overflow-hidden rounded-2xl ring-1 ring-white/10"
              >
                <img
                  src={businessWithReviews.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] text-zinc-300">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
