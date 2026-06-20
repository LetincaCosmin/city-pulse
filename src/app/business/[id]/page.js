import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { businesses, getBusinessById } from "@/data/businesses";
import { showDemoContent } from "@/data/demo";
import { normalizeEvent } from "@/data/events";
import BusinessPageClient from "@/components/BusinessPageClient";
import {
  calculateBusinessReviewSummary,
  getAuthorInitial,
} from "@/lib/businessReviews";
import { normalizePostsLikeState } from "@/lib/postLikes";

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

async function getBusinessPosts(business) {
  if (!business?.id && !business?.name) return [];

  const postsById = [];

  if (UUID_PATTERN.test(business.id)) {
    const { data, error } = await supabase
      .from("posts")
      .select("*, post_likes(user_id)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(12);

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
    .select("*, post_likes(user_id)")
    .eq("business_name", business.name)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Eroare la incarcarea postarilor business:", error.message);
    return postsById;
  }

  const postsByName = data || [];
  const seen = new Set();

  return normalizePostsLikeState(
    [...postsById, ...postsByName]
      .filter((post) => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      })
      .slice(0, 5),
  );
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

export async function generateMetadata({ params }) {
  const { id } = await params;
  const business = await getBusiness(id);

  if (!business) {
    return {
      title: "Business local",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = `${business.name} pe Pulse City: ${business.category}, adresa ${business.address}, program si detalii pentru Resita.`;

  return {
    title: business.name,
    description,
    alternates: {
      canonical: `/business/${business.id}`,
    },
    openGraph: {
      title: `${business.name} | Pulse City`,
      description,
      url: `/business/${business.id}`,
      images: [business.cover || "/images/resita-bg.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${business.name} | Pulse City`,
      description,
      images: [business.cover || "/images/resita-bg.png"],
    },
  };
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
    <BusinessPageClient
      business={businessWithReviews}
      recentPosts={recentPosts}
      businessEvents={businessEvents}
      initialReviews={reviewData.reviews}
      fallbackReviewSummary={{
        rating: business.rating,
        reviews: business.reviews,
      }}
      isLiveBusiness={reviewData.isLiveBusiness}
    />
  );
}
