import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { showDemoContent } from "@/data/demo";
import { eventTypes, events as mockEvents, mergeEvents } from "@/data/events";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function getEventList() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare la incarcarea evenimentelor:", error.message);
    return mergeEvents([], showDemoContent ? mockEvents : []);
  }

  return mergeEvents(data || [], showDemoContent ? mockEvents : []);
}

export default async function EventsPage() {
  const eventList = await getEventList();

  return (
    <div className="px-5 pb-10 pt-6">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#ff003c]">
          City Pulse
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Evenimente
        </h1>
        <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-zinc-500">
          Concerte, festivaluri, gaming nights si iesiri locale. Tot ce misca
          in Resita, intr-un singur loc.
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
          Cauta evenimente...
        </span>
      </div>

      <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
        {eventTypes.map((type, index) => (
          <button
            key={type}
            className={`h-9 shrink-0 rounded-full px-4 text-xs transition-all ${
              index === 0
                ? "bg-[#ff003c] text-white shadow-[0_0_18px_rgba(255,0,60,0.35)]"
                : "bg-[#101014] text-zinc-400 ring-1 ring-white/10"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        {eventList.length > 0 ? (
          eventList.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="relative block overflow-hidden rounded-3xl"
            style={{
              backgroundColor: "#101014",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
            }}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={event.poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,0,60,0.38),transparent_30%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute left-4 top-4 w-12 overflow-hidden rounded-xl bg-black/70 text-center ring-1 ring-[#ff003c]/70">
                <div className="pt-1 text-xl font-semibold leading-7 text-white">
                  {event.date}
                </div>
                <div className="bg-[#ff003c] py-0.5 text-[10px] text-white">
                  {event.month}
                </div>
              </div>
              <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#ff003c] ring-1 ring-[#ff003c]/35">
                {event.type}
              </span>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-tight text-white">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {event.organizer}
                  </p>
                </div>
                <Sparkles size={18} className="mt-1 shrink-0 text-[#ff003c]" />
              </div>

              <div className="grid gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-[#ff003c]" />
                  {event.fullDate}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={13} className="text-[#ff003c]" />
                  {event.time}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={13} className="text-[#ff003c]" />
                  {event.location}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <Users size={14} className="text-[#ff003c]" />
                  {event.attendees} participa
                </span>
                <span className="rounded-xl bg-[#ff003c] px-3 py-2 text-xs font-medium text-white">
                  Detalii
                </span>
              </div>
            </div>
          </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm font-light text-zinc-500">
              Nu exista evenimente publicate momentan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
