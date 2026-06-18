"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  PenSquare,
  ShieldCheck,
  Store,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { normalizeEvent } from "@/data/events";
import { legalInfo } from "@/data/legal";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

function splitPostText(text = "") {
  const [firstLine, ...rest] = text.split("\n").filter(Boolean);

  return {
    title: firstLine || "Update local",
    body: rest.join("\n") || text,
  };
}

function formatSavedDate(value) {
  if (!value) return "salvat recent";

  try {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "salvat recent";
  }
}

function getSupabaseErrorMessage(error) {
  return error?.message || error?.details || "Eroare necunoscuta";
}

function normalizeDisplayText(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedBusinesses, setSavedBusinesses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [profileForm, setProfileForm] = useState(() => ({
    name: user?.name || "",
    bio: user?.bio || "",
  }));
  const [profileMessage, setProfileMessage] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [pendingRemoveKey, setPendingRemoveKey] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "business") {
      router.replace("/dashboard");
      return;
    }

    let isMounted = true;

    async function fetchProfileData() {
      const [
        profileResult,
        eventsResult,
        savedPostsResult,
        savedBusinessesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, bio, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("event_participants")
          .select("created_at, events(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("post_saves")
          .select("created_at, posts(id, business_id, business_name, tag, text, image, created_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_saves")
          .select("created_at, businesses(id, name, category, location_name, image_url, logo_url)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      const criticalProfileError = profileResult.error || eventsResult.error;
      const optionalProfileError =
        savedPostsResult.error || savedBusinessesResult.error;

      if (criticalProfileError) {
        console.warn(
          "Eroare la incarcarea profilului:",
          getSupabaseErrorMessage(criticalProfileError),
        );
        setErrorMsg("Nu am putut incarca toate datele profilului acum.");
      } else {
        setErrorMsg("");
      }

      if (optionalProfileError) {
        console.warn(
          "Unele date optionale ale profilului nu sunt disponibile:",
          getSupabaseErrorMessage(optionalProfileError),
        );
      }

      if (profileResult.data) {
        setProfileDetails(profileResult.data);
        setProfileForm((currentForm) => ({
          name:
            currentForm.name ||
            profileResult.data.name ||
            user.name ||
            user.email?.split("@")[0] ||
            "",
          bio: currentForm.bio || profileResult.data.bio || user.bio || "",
        }));
      }

      const events = (eventsResult.data || [])
        .map((item) => item.events)
        .filter(Boolean)
        .map(normalizeEvent);
      const nextSavedPosts = (savedPostsResult.data || [])
        .map((item) =>
          item.posts
            ? {
                ...item.posts,
                savedAt: item.created_at,
              }
            : null,
        )
        .filter(Boolean);
      const nextSavedBusinesses = (savedBusinessesResult.data || [])
        .map((item) =>
          item.businesses
            ? {
                ...item.businesses,
                savedAt: item.created_at,
              }
            : null,
        )
        .filter(Boolean);

      setParticipatingEvents(events);
      setSavedPosts(nextSavedPosts);
      setSavedBusinesses(nextSavedBusinesses);

      setLoadingData(false);
    }

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [router, user]);

  const stats = useMemo(
    () => [
      {
        label: "Evenimente",
        value: participatingEvents.length,
        icon: CalendarDays,
      },
      { label: "Salvate", value: savedPosts.length, icon: Bookmark },
      { label: "Favorite", value: savedBusinesses.length, icon: Heart },
    ],
    [participatingEvents.length, savedBusinesses.length, savedPosts.length],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const openProfileEditor = () => {
    if (!user) return;

    setProfileMessage("");
    setProfileForm({
      name: profileDetails?.name || user.name || "",
      bio: profileDetails?.bio || user.bio || "",
    });
    setIsProfileEditorOpen(true);
  };

  const closeProfileEditor = () => {
    if (isProfileSaving) return;
    setIsProfileEditorOpen(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMessage("Alege o imagine valida.");
      return;
    }

    setIsAvatarUploading(true);
    setAvatarMessage("");

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 320,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.7,
      });
      const filePath = `${user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, {
          cacheControl: "60",
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name:
            profileDetails?.name ||
            user.name ||
            profileForm.name.trim() ||
            user.email?.split("@")[0] ||
            "Cont local",
          role: user.role || "user",
          category: user.category || null,
          avatar_url: avatarUrl,
          bio: profileDetails?.bio || user.bio || "",
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;

      setAvatarPreview(avatarUrl);
      setProfileDetails((currentProfile) => ({
        ...(currentProfile || {}),
        avatar_url: avatarUrl,
      }));
      setAvatarMessage("Poza salvata.");
      setIsAvatarUploading(false);
      void refreshUser();
    } catch (err) {
      console.error("Eroare la upload avatar:", err);
      setAvatarMessage("Nu am putut salva poza.");
      setIsAvatarUploading(false);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!user) return;

    const trimmedName = profileForm.name.trim();
    const trimmedBio = profileForm.bio.trim();

    if (!trimmedName) {
      setProfileMessage("Introdu un nume afisat.");
      return;
    }

    setIsProfileSaving(true);
    setProfileMessage("");

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: trimmedName,
          role: user.role || "user",
          category: user.category || null,
          avatar_url: user.avatarUrl || null,
          bio: trimmedBio,
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      setProfileMessage("Profilul a fost actualizat.");
      setProfileDetails((currentProfile) => ({
        ...(currentProfile || {}),
        name: trimmedName,
        bio: trimmedBio,
        avatar_url: user.avatarUrl || currentProfile?.avatar_url || null,
      }));
      await refreshUser();
      setIsProfileEditorOpen(false);
    } catch (err) {
      console.error("Nu am putut salva profilul:", err);
      setProfileMessage("Nu am putut salva profilul acum.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleRemoveSavedPost = async (postId) => {
    if (!user?.id || !postId) return;

    setPendingRemoveKey(`post-${postId}`);

    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Nu am putut elimina postarea salvata:", error);
      setErrorMsg("Nu am putut actualiza lista de salvate.");
      setPendingRemoveKey("");
      return;
    }

    setSavedPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );
    setPendingRemoveKey("");
  };

  const handleRemoveSavedBusiness = async (businessId) => {
    if (!user?.id || !businessId) return;

    setPendingRemoveKey(`business-${businessId}`);

    const { error } = await supabase
      .from("business_saves")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Nu am putut elimina business-ul salvat:", error);
      setErrorMsg("Nu am putut actualiza locurile favorite.");
      setPendingRemoveKey("");
      return;
    }

    setSavedBusinesses((currentBusinesses) =>
      currentBusinesses.filter((business) => business.id !== businessId),
    );
    setPendingRemoveKey("");
  };

  if (!user || user.role === "business") {
    return null;
  }

  const profileAvatarUrl =
    typeof profileDetails?.avatar_url === "string"
      ? profileDetails.avatar_url
      : "";
  const avatarImageUrl = avatarPreview || profileAvatarUrl || user.avatarUrl;
  const trimmedProfileName = normalizeDisplayText(profileDetails?.name);
  const trimmedUserName = normalizeDisplayText(user.name);
  const trimmedFormName = normalizeDisplayText(profileForm.name);
  const emailDisplayName = normalizeDisplayText(user.email?.split("@")[0]);
  const displayName =
    trimmedProfileName ||
    trimmedUserName ||
    trimmedFormName ||
    emailDisplayName ||
    "Cont local";
  const displayBio =
    typeof profileDetails?.bio === "string" ? profileDetails.bio : user.bio || "";
  const avatarInitial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#09090b] px-4 pt-6 pb-28 text-white sm:px-6 md:pb-10">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#ff003c]">
              Cont local
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Profil</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openProfileEditor}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 text-sm font-semibold text-zinc-300 transition hover:border-[#ff003c]/50 hover:text-white"
            >
              <PenSquare size={16} className="text-[#ff003c]" />
              <span className="hidden sm:inline">Editeaza profil</span>
              <span className="sm:hidden">Editeaza</span>
            </button>
            <button
              onClick={handleLogout}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-400 transition hover:border-[#ff003c]/50 hover:text-[#ff003c]"
              aria-label="Delogare"
            >
              <LogOut size={18} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-zinc-800/90 bg-zinc-950/80 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
        <div className="relative h-28 bg-[radial-gradient(circle_at_25%_20%,rgba(255,0,60,0.35),transparent_32%),linear-gradient(135deg,#141418,#060607)]">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>
        <div className="-mt-9 px-4 pb-4 sm:px-5">
          <div className="relative z-10 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3">
            <div>
              <label
                htmlFor="avatar-upload"
                className="group relative grid h-[72px] w-[72px] cursor-pointer place-items-center overflow-hidden rounded-[22px] border border-[#ff003c]/80 bg-black bg-cover bg-center text-xl font-bold text-[#ff003c] shadow-[0_0_24px_rgba(255,0,60,0.25)]"
                style={
                  avatarImageUrl
                    ? { backgroundImage: `url(${avatarImageUrl})` }
                    : undefined
                }
              >
                {avatarImageUrl ? null : avatarInitial}
                <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/55 group-hover:opacity-100">
                  {isAvatarUploading ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Camera size={20} strokeWidth={1.8} />
                  )}
                </span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isAvatarUploading}
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="relative z-10 flex h-[72px] min-w-0 flex-col justify-center rounded-[22px] border border-white/10 bg-zinc-950/90 px-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04]">
              <p
                data-profile-display-name={displayName}
                className="max-w-full truncate text-2xl font-extrabold leading-tight text-white"
              >
                {displayName}
              </p>
              <p className="mt-1 truncate text-sm text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 max-w-[460px] rounded-3xl border border-white/10 bg-black/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ff003c]">
              Bio
            </p>
            <p
              className={`mt-2 text-sm leading-relaxed ${
                displayBio ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {displayBio ||
                "Adauga cateva randuri despre tine si cum folosesti City Pulse."}
            </p>
          </div>

          {avatarMessage || profileMessage ? (
            <div className="mt-2 space-y-1 text-xs text-zinc-500">
              {avatarMessage ? <p>{avatarMessage}</p> : null}
              {profileMessage ? <p>{profileMessage}</p> : null}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-800/80 bg-black/40 p-2.5"
                >
                  <Icon
                    className="text-[#ff003c]"
                    size={15}
                    strokeWidth={1.8}
                  />
                  <p className="mt-2 text-lg font-bold">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Evenimentele mele</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Evenimente la care ai apasat ca participi.
            </p>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-1 text-xs font-semibold text-[#ff003c]"
          >
            Exploreaza
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {errorMsg ? (
          <div className="rounded-3xl border border-[#ff003c]/30 bg-[#ff003c]/10 p-4 text-sm text-red-100">
            {errorMsg}
          </div>
        ) : loadingData ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 text-sm text-zinc-500">
            Se incarca profilul...
          </div>
        ) : participatingEvents.length > 0 ? (
          <div className="space-y-3">
            {participatingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-3 rounded-3xl border border-zinc-800/90 bg-zinc-950/70 p-3 transition hover:border-[#ff003c]/50"
              >
                <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#ff003c]/50 bg-[#ff003c]/10 text-center text-[#ff003c]">
                  <span className="text-2xl font-bold leading-none">
                    {event.date}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">
                    {event.month}
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-400">
                      {event.type}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {event.time}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold transition group-hover:text-[#ff003c]">
                    {event.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin size={13} />
                    <span className="truncate">{event.location}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#ff003c]/10 text-[#ff003c]">
              <Ticket size={20} />
            </div>
            <h3 className="font-bold">Nu ai evenimente inca</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Cand apesi pe &quot;Vreau sa particip&quot; la un eveniment,
              apare aici.
            </p>
            <Link
              href="/events"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#ff003c] px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,0,60,0.25)]"
            >
              Vezi evenimente
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Salvate</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Postari pe care vrei sa le gasesti din nou rapid.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-semibold text-[#ff003c]"
          >
            Feed
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {loadingData ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 text-sm text-zinc-500">
            Se incarca salvarile...
          </div>
        ) : savedPosts.length > 0 ? (
          <div className="space-y-3">
            {savedPosts.map((post) => {
              const postText = splitPostText(post.text);
              const businessHref = post.business_id ? `/business/${post.business_id}` : "/";

              return (
                <div
                  key={post.id}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={businessHref}
                        className="truncate text-xs font-semibold text-[#ff003c]"
                      >
                        {post.business_name || "Business local"}
                      </Link>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        Salvat pe {formatSavedDate(post.savedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveSavedPost(post.id)}
                      disabled={pendingRemoveKey === `post-${post.id}`}
                      className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-800 bg-black/40 text-[#ff003c] transition hover:border-[#ff003c]/50 disabled:opacity-50"
                    >
                      <Bookmark size={15} fill="currentColor" />
                    </button>
                  </div>

                  {post.tag ? (
                    <span className="rounded-full bg-[#ff003c]/10 px-2.5 py-1 text-[10px] font-semibold text-[#ff003c] ring-1 ring-[#ff003c]/20">
                      {post.tag}
                    </span>
                  ) : null}

                  <Link href={`/#post-${post.id}`} className="mt-3 block">
                    <h3 className="text-base font-bold text-white transition hover:text-[#ff003c]">
                      {postText.title}
                    </h3>
                    {postText.body ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                        {postText.body}
                      </p>
                    ) : null}
                    {post.image ? (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-black/40">
                        <img
                          src={post.image}
                          alt={postText.title}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <Bookmark className="mb-4 text-[#ff003c]" size={21} />
            <h3 className="font-bold">Nu ai postari salvate</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Apasa pe bookmark in feed ca sa pastrezi postarile importante.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Locuri favorite</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Business-uri locale pe care vrei sa le ai aproape.
            </p>
          </div>
          <Link
            href="/business"
            className="flex items-center gap-1 text-xs font-semibold text-[#ff003c]"
          >
            Exploreaza
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {loadingData ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 text-sm text-zinc-500">
            Se incarca locurile favorite...
          </div>
        ) : savedBusinesses.length > 0 ? (
          <div className="space-y-3">
            {savedBusinesses.map((business) => {
              const businessLogo = business.logo_url || business.image_url || null;
              const businessInitials =
                business.name
                  ?.split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 3)
                  .toUpperCase() || "CP";

              return (
                <div
                  key={business.id}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Link
                      href={`/business/${business.id}`}
                      className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 text-sm font-bold text-[#ff003c]"
                    >
                      {businessLogo ? (
                        <img
                          src={businessLogo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        businessInitials
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/business/${business.id}`}
                            className="truncate text-base font-bold text-white transition hover:text-[#ff003c]"
                          >
                            {business.name}
                          </Link>
                          <p className="mt-1 text-xs text-zinc-500">
                            {business.category || "Business local"}
                          </p>
                          <p className="mt-2 text-[11px] text-zinc-600">
                            {business.location_name || "Resita"} - salvat pe{" "}
                            {formatSavedDate(business.savedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRemoveSavedBusiness(business.id)}
                          disabled={pendingRemoveKey === `business-${business.id}`}
                          className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-800 bg-black/40 text-[#ff003c] transition hover:border-[#ff003c]/50 disabled:opacity-50"
                        >
                          <Heart size={15} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
            <Store className="mb-4 text-[#ff003c]" size={21} />
            <h3 className="font-bold">Nu ai locuri favorite inca</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Intra pe pagina unui business si apasa pe &quot;Salveaza&quot;.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
        <ShieldCheck className="mb-4 text-[#ff003c]" size={21} />
        <h3 className="font-bold">Date si confidentialitate</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Poti consulta documentele legale sau ne poti cere accesul,
          rectificarea ori stergerea datelor contului tau.
        </p>

        <div className="mt-5 grid gap-2">
          <LegalProfileLink href="/privacy" icon={FileText}>
            Politica de confidentialitate
          </LegalProfileLink>
          <LegalProfileLink href="/terms" icon={FileText}>
            Termeni si conditii
          </LegalProfileLink>
          <LegalProfileLink href="/cookies" icon={FileText}>
            Politica cookies
          </LegalProfileLink>
          <a
            href={`mailto:${legalInfo.contactEmail}?subject=Solicitare stergere date City Pulse`}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-300 transition hover:border-[#ff003c]/50 hover:text-white"
          >
            <span className="flex items-center gap-3">
              <Mail size={16} className="text-[#ff003c]" />
              Solicita stergerea datelor
            </span>
            <ArrowUpRight size={15} className="text-zinc-600" />
          </a>
        </div>
      </section>

      {isProfileEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[28px] border border-zinc-800 bg-[#111113] p-5 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={closeProfileEditor}
              disabled={isProfileSaving}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/30 text-zinc-500 transition hover:text-white disabled:opacity-50"
              aria-label="Inchide editorul"
            >
              <X size={16} />
            </button>

            <div className="pr-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff003c]">
                Profil public
              </p>
              <h2 className="mt-2 text-xl font-bold">Editeaza bio-ul</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Numele si bio-ul apar in profilul tau si in interactiunile publice.
              </p>
            </div>

            <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Nume afisat
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  maxLength={50}
                  onChange={(event) =>
                    setProfileForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-[#ff003c]/60"
                  placeholder="Cum vrei sa apari in City Pulse"
                  disabled={isProfileSaving}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  maxLength={240}
                  rows={4}
                  onChange={(event) =>
                    setProfileForm((currentForm) => ({
                      ...currentForm,
                      bio: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none transition focus:border-[#ff003c]/60"
                  placeholder="Cateva randuri despre tine, ce iti place in oras sau ce cauti pe City Pulse."
                  disabled={isProfileSaving}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-zinc-600">
                  <span>Scurt, clar si personal.</span>
                  <span>{profileForm.bio.length}/240</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  disabled={isProfileSaving}
                  className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-semibold text-zinc-300 transition hover:text-white disabled:opacity-50"
                >
                  Anuleaza
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#ff003c] px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,0,60,0.2)] disabled:opacity-60"
                >
                  {isProfileSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Salveaza</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LegalProfileLink({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-300 transition hover:border-[#ff003c]/50 hover:text-white"
    >
      <span className="flex items-center gap-3">
        <Icon size={16} className="text-[#ff003c]" />
        {children}
      </span>
      <ArrowUpRight size={15} className="text-zinc-600" />
    </Link>
  );
}
