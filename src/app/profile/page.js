"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Camera,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Store,
  Ticket,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { normalizeEvent } from "@/data/events";
import { legalInfo } from "@/data/legal";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

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
      const { data, error } = await supabase
        .from("event_participants")
        .select("created_at, events(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Eroare la incarcarea profilului:", error);
        setErrorMsg("Nu am putut incarca evenimentele tale acum.");
        setParticipatingEvents([]);
      } else {
        const events = (data || [])
          .map((item) => item.events)
          .filter(Boolean)
          .map(normalizeEvent);

        setErrorMsg("");
        setParticipatingEvents(events);
      }

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
      { label: "Salvate", value: 0, icon: Bookmark },
      { label: "Favorite", value: 0, icon: Heart },
    ],
    [participatingEvents.length],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
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
          name: user.name,
          role: user.role || "user",
          category: user.category || null,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;

      setAvatarPreview(avatarUrl);
      setAvatarMessage("Poza salvata.");
      setIsAvatarUploading(false);
      void refreshUser();
    } catch (err) {
      console.error("Eroare la upload avatar:", err);
      setAvatarMessage("Nu am putut salva poza.");
      setIsAvatarUploading(false);
    }
  };

  if (!user || user.role === "business") {
    return null;
  }

  const avatarImageUrl = avatarPreview || user.avatarUrl;

  return (
    <div className="min-h-screen bg-[#09090b] px-4 pt-8 pb-28 text-white sm:px-6 md:pb-10">
      <header className="mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.45em] text-[#ff003c]">
          Cont local
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
            <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-zinc-500">
              Locul tau pentru evenimente, salvate si activitatea din oras.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-zinc-800 bg-zinc-950/80 text-zinc-400 transition hover:border-[#ff003c]/50 hover:text-[#ff003c]"
            aria-label="Delogare"
          >
            <LogOut size={18} strokeWidth={1.7} />
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-zinc-800/90 bg-zinc-950/80 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
        <div className="relative h-32 bg-[radial-gradient(circle_at_25%_20%,rgba(255,0,60,0.35),transparent_32%),linear-gradient(135deg,#141418,#060607)]">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>
        <div className="-mt-11 px-5 pb-5">
          <div className="relative mb-4 flex items-end justify-between gap-4">
            <div>
              <label
                htmlFor="avatar-upload"
                className="group relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-[24px] border border-[#ff003c]/80 bg-black bg-cover bg-center text-2xl font-bold text-[#ff003c] shadow-[0_0_24px_rgba(255,0,60,0.25)]"
                style={
                  avatarImageUrl
                    ? { backgroundImage: `url(${avatarImageUrl})` }
                    : undefined
                }
              >
                {avatarImageUrl ? null : user.avatar || "U"}
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
            <span className="rounded-full border border-[#ff003c]/40 bg-[#ff003c]/10 px-3 py-1 text-[11px] font-semibold text-[#ff003c]">
              User
            </span>
          </div>

          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
          {avatarMessage ? (
            <p className="mt-2 text-xs text-zinc-500">{avatarMessage}</p>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-800/80 bg-black/40 p-3"
                >
                  <Icon
                    className="mb-3 text-[#ff003c]"
                    size={17}
                    strokeWidth={1.8}
                  />
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
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

      <section className="mt-8 grid grid-cols-1 gap-3">
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
          <Bookmark className="mb-4 text-[#ff003c]" size={21} />
          <h3 className="font-bold">Salvate</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Aici vom lega postarile si locurile salvate in etapa urmatoare.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
          <Store className="mb-4 text-[#ff003c]" size={21} />
          <h3 className="font-bold">Locuri favorite</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Cafenele, servicii, magazine si business-uri locale favorite.
          </p>
        </div>
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
