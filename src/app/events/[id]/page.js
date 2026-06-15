import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Clock,
  MapPin,
  MessageCircle,
  QrCode,
  Share2,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import EventParticipationPanel from "@/components/EventParticipationPanel";
import { showDemoContent } from "@/data/demo";
import { events, getEventById, normalizeEvent } from "@/data/events";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateStaticParams() {
  return showDemoContent ? events.map((event) => ({ id: event.id })) : [];
}

async function getEvent(id) {
  if (!UUID_PATTERN.test(id)) {
    return showDemoContent ? getEventById(id) : undefined;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Eroare la incarcarea evenimentului:", error.message);
  }

  return data ? normalizeEvent(data) : undefined;
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="pb-10">
      <header className="relative h-[340px] overflow-hidden">
        <img
          src={event.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,0,60,0.42),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/42 to-black/25" />

        <div className="absolute left-5 right-5 top-6 flex items-center justify-between">
          <Link
            href="/events"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15"
          >
            <ArrowLeft size={18} />
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15">
            <Share2 size={18} />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-4 flex items-end gap-3">
            <div className="w-14 overflow-hidden rounded-2xl bg-black/75 text-center ring-1 ring-[#ff003c]/80">
              <div className="pt-1 text-2xl font-semibold leading-8 text-white">
                {event.date}
              </div>
              <div className="bg-[#ff003c] py-1 text-[10px] font-medium text-white">
                {event.month}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#ff003c]">
                {event.type}
              </p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight text-white">
                {event.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-300">{event.organizer}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5">
        <section
          className="-mt-2 mb-5 rounded-3xl p-4"
          style={{
            backgroundColor: "#101014",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          }}
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["02", "zile"],
              ["14", "ore"],
              ["32", "min"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl bg-black/35 px-3 py-3 ring-1 ring-white/10"
              >
                <div className="text-xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <CalendarDays size={15} className="text-[#ff003c]" />
              {event.fullDate}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={15} className="text-[#ff003c]" />
              {event.time}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-[#ff003c]" />
              {event.address}
            </span>
            <span className="flex items-center gap-2">
              <Ticket size={15} className="text-[#ff003c]" />
              {event.price}
            </span>
          </div>
        </section>

        <EventParticipationPanel
          eventId={event.id}
          going={event.going}
          initialAttendees={event.attendees}
        />

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-white">
            Despre eveniment
          </h2>
          <p className="text-sm font-light leading-relaxed text-zinc-400">
            {event.description}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-white">Lineup</h2>
          <div className="space-y-2">
            {event.lineup.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl bg-[#101014] px-4 py-3 text-sm text-white ring-1 ring-white/10"
              >
                <span>{item}</span>
                <span className="text-[10px] uppercase tracking-wide text-[#ff003c]">
                  Live
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-white">Galerie</h2>
          <div className="grid grid-cols-3 gap-3">
            {event.gallery.map((item) => (
              <div
                key={item}
                className="relative h-24 overflow-hidden rounded-2xl ring-1 ring-white/10"
              >
                <img
                  src={event.poster}
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

        <section className="grid grid-cols-4 gap-3">
          {[
            [Bell, "Remind"],
            [UserPlus, "Invite"],
            [QrCode, "QR"],
            [MessageCircle, "Chat"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[#101014] text-zinc-400 ring-1 ring-white/10"
            >
              <Icon size={17} className="text-[#ff003c]" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </section>

        <div className="mt-5 rounded-2xl border border-dashed border-[#ff003c]/30 bg-[#ff003c]/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Users size={16} className="text-[#ff003c]" />
            Check-in la eveniment
          </div>
          <p className="mt-1 text-xs font-light text-zinc-500">
            Pentru MVP, il afisam vizual. Check-in-ul real si validarea QR vin
            in urmatorul pas.
          </p>
        </div>
      </main>
    </div>
  );
}
