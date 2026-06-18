"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  Clock,
  Globe,
  Heart,
  MapPin,
  Phone,
  Share2,
  Star,
  X,
} from "lucide-react";
import BusinessSaveButton from "@/components/BusinessSaveButton";
import BusinessReviewsSection from "@/components/BusinessReviewsSection";
import { getPostLikeLabel } from "@/lib/postLikes";

const TABS = [
  { id: "despre", label: "Despre" },
  { id: "oferte", label: "Oferte" },
  { id: "evenimente", label: "Evenimente" },
  { id: "recenzii", label: "Recenzii" },
];

function splitPostText(text = "") {
  const [firstLine, ...rest] = text.split("\n").filter(Boolean);

  return {
    title: firstLine || "Update local",
    body: rest.join("\n") || text,
  };
}

function isOfferPost(post) {
  const postCategory = post?.category?.toLowerCase?.() || "";
  const postTag = post?.tag?.toLowerCase?.() || "";

  return postCategory === "oferte" || postTag.includes("oferta");
}

function hasFallbackOffer(offers = []) {
  return offers.some((offer) => offer && offer !== "Nicio oferta activa momentan");
}

function getPhoneHref(phone) {
  const normalized = phone?.replace(/[^\d+]/g, "") || "";

  return normalized ? `tel:${normalized}` : null;
}

function getInstagramHref(instagram) {
  if (!instagram || instagram === "Instagram necompletat") return null;

  const handle = instagram.replace(/^@/, "").trim();
  return handle ? `https://instagram.com/${handle}` : null;
}

function getWebsiteHref(website) {
  if (!website || website === "Website necompletat") return null;

  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm font-light text-zinc-500">
      {text}
    </div>
  );
}

function BusinessPostList({ posts, onOpenImage, emptyText }) {
  if (posts.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
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
                <span className="text-[10px] text-zinc-600">recent</span>
              </div>

              <h3 className="text-sm font-semibold text-white">{postText.title}</h3>

              {postText.body ? (
                <p className="mt-2 text-xs font-light leading-relaxed text-zinc-400">
                  {postText.body}
                </p>
              ) : null}
            </div>

            {post.image ? (
              <button
                type="button"
                onClick={() =>
                  onOpenImage({
                    src: post.image,
                    alt: postText.title,
                    frameClassName: "max-w-3xl",
                  })
                }
                className="mx-4 mb-4 block overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10"
              >
                <img
                  src={post.image}
                  alt={postText.title}
                  className="block h-auto max-h-[380px] w-full object-contain"
                />
              </button>
            ) : null}

            <div className="flex items-center gap-2 px-4 pb-4 text-[11px] text-zinc-500">
              <Heart
                size={14}
                className="text-[#ff003c]"
                fill={post.likesCount > 0 ? "currentColor" : "none"}
              />
              <span>{getPostLikeLabel(post.likesCount || 0)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ActionCard({ href, onClick, icon: Icon, label, disabled = false }) {
  const className = `group flex h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border bg-black/30 px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
    disabled
      ? "cursor-default border-white/6 text-zinc-700"
      : "border-white/10 text-zinc-300 hover:border-[#ff003c]/30 hover:bg-black/40"
  }`;
  const iconWrapClassName = `grid h-9 w-9 place-items-center rounded-full transition ${
    disabled
      ? "bg-white/5 text-zinc-600"
      : "bg-white/5 text-white group-hover:bg-[#ff003c]/12 group-hover:text-[#ff003c]"
  }`;

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={className}
      >
        <span className={iconWrapClassName}>
          <Icon size={18} />
        </span>
        <span className="text-[11px] font-medium">{label}</span>
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <span className={iconWrapClassName}>
        <Icon size={18} />
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

export default function BusinessPageClient({
  business,
  recentPosts,
  businessEvents,
  initialReviews,
  fallbackReviewSummary,
  isLiveBusiness,
}) {
  const [activeTab, setActiveTab] = useState("despre");
  const [lightboxImage, setLightboxImage] = useState(null);

  const offerPosts = useMemo(
    () => recentPosts.filter((post) => isOfferPost(post)),
    [recentPosts],
  );
  const updatePosts = useMemo(
    () => recentPosts.filter((post) => !isOfferPost(post)),
    [recentPosts],
  );

  const phoneHref = getPhoneHref(business.phone);
  const instagramHref = getInstagramHref(business.instagram);
  const websiteHref = getWebsiteHref(business.website);

  const handleShare = async () => {
    const currentUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: business.name,
          text: `Vezi pagina ${business.name} pe City Pulse.`,
          url: currentUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(currentUrl);
      window.alert("Link-ul paginii a fost copiat.");
    } catch (error) {
      console.error("Nu am putut distribui pagina:", error);
    }
  };

  return (
    <div className="pb-10">
      <header className="relative h-[310px] overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setLightboxImage({
              src: business.cover,
              alt: `Coperta ${business.name}`,
              frameClassName: "max-w-4xl",
            })
          }
          className="absolute inset-0 z-0"
          aria-label="Vezi coperta marita"
        >
          <img
            src={business.cover}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        </button>
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_74%_20%,rgba(255,0,60,0.38),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/45 to-black/25" />

        <div className="absolute left-5 right-5 top-6 z-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15"
          >
            <ArrowLeft size={18} />
          </Link>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-20">
          <div className="mb-4 flex items-end gap-4">
            <button
              type="button"
              onClick={() => {
                if (!business.logoUrl) return;

                setLightboxImage({
                  src: business.logoUrl,
                  alt: `Logo ${business.name}`,
                  frameClassName: "max-w-xl",
                });
              }}
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-black/70 text-lg font-semibold tracking-wide text-[#ff003c] ring-1 ring-[#ff003c]/75"
            >
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                business.logo
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="truncate text-2xl font-semibold leading-tight text-white">
                  {business.name}
                </h1>
                <span className="h-2 w-2 rounded-full bg-[#ff003c]" />
              </div>
              <p className="text-sm text-zinc-300">{business.category}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-amber-300">
                  <Star size={14} fill="currentColor" />
                  {business.rating}
                  <span className="text-zinc-500">({business.reviews})</span>
                </span>
                <span className="text-emerald-400">{business.status}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-5">
        <section className="relative z-30 -mt-7 mb-6 grid grid-cols-4 gap-3">
          <ActionCard href={phoneHref} icon={Phone} label="Suna" disabled={!phoneHref} />
          <ActionCard
            href={instagramHref || websiteHref}
            icon={instagramHref ? AtSign : Globe}
            label={instagramHref ? "Instagram" : "Website"}
            disabled={!instagramHref && !websiteHref}
          />
          <BusinessSaveButton businessId={business.id} />
          <ActionCard onClick={() => void handleShare()} icon={Share2} label="Distribuie" />
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
              <span className="text-zinc-200">{business.schedule}</span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <MapPin size={15} className="text-[#ff003c]" />
                Adresa
              </span>
              <span className="max-w-[60%] text-right text-zinc-200">
                {business.address}
              </span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <AtSign size={15} className="text-[#ff003c]" />
                Instagram
              </span>
              <span className="text-zinc-200">{business.instagram}</span>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Globe size={15} className="text-[#ff003c]" />
                Website
              </span>
              <span className="text-zinc-200">{business.website}</span>
            </span>
          </div>
        </section>

        <nav className="-mx-4 mb-6 flex gap-6 overflow-x-auto border-b border-white/10 px-4 no-scrollbar sm:-mx-5 sm:px-5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative h-11 shrink-0 text-xs ${
                  isActive ? "text-[#ff003c]" : "text-zinc-500"
                }`}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#ff003c]" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {activeTab === "despre" ? (
          <section className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-white">Despre</h2>
            <p className="text-sm font-light leading-relaxed text-zinc-400">
              {business.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {business.vibe.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#ff003c]/10 px-3 py-1 text-[11px] text-[#ff003c] ring-1 ring-[#ff003c]/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">Noutati</h3>
                <span className="text-[11px] text-zinc-500">
                  {updatePosts.length} publicate
                </span>
              </div>

              <BusinessPostList
                posts={updatePosts}
                onOpenImage={setLightboxImage}
                emptyText="Business-ul nu are noutati publicate inca."
              />
            </div>
          </section>
        ) : null}

        {activeTab === "oferte" ? (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Oferte</h2>
              <span className="text-[11px] text-zinc-500">Active acum</span>
            </div>

            {offerPosts.length > 0 ? (
              <BusinessPostList
                posts={offerPosts}
                onOpenImage={setLightboxImage}
                emptyText="Nu exista oferte active acum."
              />
            ) : hasFallbackOffer(business.offers) ? (
              <div className="space-y-3">
                {business.offers
                  .filter((offer) => offer && offer !== "Nicio oferta activa momentan")
                  .map((offer) => (
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
            ) : (
              <EmptyState text="Nu exista oferte active acum." />
            )}
          </section>
        ) : null}

        {activeTab === "evenimente" ? (
          <section className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-white">Evenimente</h2>
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
                      <CalendarDays
                        size={16}
                        className="shrink-0 text-[#ff003c]"
                      />
                    </Link>
                  ))
                : business.events.map((event) => (
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
        ) : null}

        {activeTab === "recenzii" ? (
          <BusinessReviewsSection
            businessId={business.id}
            businessName={business.name}
            businessOwnerId={business.id}
            initialReviews={initialReviews}
            fallbackSummary={fallbackReviewSummary}
            isLiveBusiness={isLiveBusiness}
          />
        ) : null}
      </main>

      {lightboxImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute inset-0"
            aria-label="Inchide modalul imaginii"
          />
          <div
            className={`relative z-10 w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#101014] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${
              lightboxImage.frameClassName || "max-w-3xl"
            }`}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/10"
              aria-label="Inchide imaginea"
            >
              <X size={18} />
            </button>
            <div className="bg-black/35 p-3 sm:p-4">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-h-[72vh] w-full rounded-2xl object-contain"
            />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
