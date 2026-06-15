"use client";

import { useEffect, useMemo, useState } from "react";
import { Ticket, UserPlus } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function EventParticipationPanel({
  eventId,
  going = [],
  initialAttendees = 0,
}) {
  const [participantCount, setParticipantCount] = useState(0);
  const [isGoing, setIsGoing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isRealEvent = UUID_PATTERN.test(eventId);

  useEffect(() => {
    let isMounted = true;

    async function loadParticipation() {
      if (!isRealEvent) return;

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { count, error: countError } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      let participates = false;

      if (user) {
        const { data: participant } = await supabase
          .from("event_participants")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();

        participates = Boolean(participant);
      }

      if (!isMounted) return;

      if (!countError && typeof count === "number") {
        setParticipantCount(count);
      }

      setUserId(user?.id || null);
      setIsGoing(participates);
      setLoading(false);
    }

    loadParticipation();

    return () => {
      isMounted = false;
    };
  }, [eventId, isRealEvent]);

  const totalAttendees = useMemo(
    () => initialAttendees + participantCount,
    [initialAttendees, participantCount],
  );

  const handleToggleParticipation = async () => {
    if (!isRealEvent) {
      alert("Participarea reala este disponibila pentru evenimentele create in aplicatie.");
      return;
    }

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);

    try {
      if (isGoing) {
        const { error } = await supabase
          .from("event_participants")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId);

        if (error) throw error;

        setIsGoing(false);
        setParticipantCount((current) => Math.max(0, current - 1));
      } else {
        const { error } = await supabase.from("event_participants").insert([
          {
            event_id: eventId,
            user_id: userId,
          },
        ]);

        if (error) {
          if (error.code === "23505") {
            setIsGoing(true);
            return;
          }

          throw error;
        }

        const [{ data: eventData }, { data: profileData }] = await Promise.all([
          supabase
            .from("events")
            .select("title, business_id")
            .eq("id", eventId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("name")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        if (eventData?.business_id && eventData.business_id !== userId) {
          await createNotification({
            userId: eventData.business_id,
            targetRole: "business",
            actorId: userId,
            type: "event_participant",
            title: "Participant nou",
            body: `${profileData?.name || "Cineva"} participa la ${eventData.title}`,
            href: `/events/${eventId}`,
            metadata: {
              event_id: eventId,
            },
          });
        }

        setIsGoing(true);
        setParticipantCount((current) => current + 1);
      }
    } catch (err) {
      alert("Nu am putut actualiza participarea: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {going.map((initials) => (
              <span
                key={initials}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#19191f] text-[10px] font-semibold text-white ring-2 ring-[#09090b]"
              >
                {initials}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-400">
            {loading ? "Se incarca..." : `${totalAttendees} vor participa`}
          </span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#151519] text-white ring-1 ring-white/10">
          <UserPlus size={16} />
        </button>
      </div>

      <button
        onClick={handleToggleParticipation}
        disabled={saving}
        className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-[0_0_22px_rgba(255,0,60,0.35)] transition-all ${
          isGoing
            ? "bg-[#101014] ring-1 ring-[#ff003c]/45"
            : "bg-[#ff003c] hover:bg-[#d60032]"
        } ${saving ? "opacity-70" : ""}`}
      >
        <Ticket size={17} />
        {saving
          ? "Se salveaza..."
          : isGoing
            ? "Participi"
            : "Vreau sa particip"}
      </button>
    </section>
  );
}
