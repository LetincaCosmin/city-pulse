"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BusinessSaveButton({ businessId }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const isSavableBusiness = UUID_PATTERN.test(businessId || "");

  useEffect(() => {
    let isMounted = true;

    async function fetchSavedState() {
      if (!user?.id || !isSavableBusiness) {
        if (isMounted) setIsSaved(false);
        return;
      }

      const { data, error } = await supabase
        .from("business_saves")
        .select("id")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Nu am putut verifica salvarea business-ului:", error.message);
        setIsSaved(false);
        return;
      }

      setIsSaved(Boolean(data?.id));
    }

    fetchSavedState();

    return () => {
      isMounted = false;
    };
  }, [businessId, isSavableBusiness, user?.id]);

  const handleToggleSave = async () => {
    if (!isSavableBusiness) {
      alert("Salvarile pentru business-uri demo nu sunt disponibile inca.");
      return;
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (isPending) return;

    const nextSaved = !isSaved;
    setIsPending(true);
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        const { error } = await supabase.from("business_saves").insert([
          {
            business_id: businessId,
            user_id: user.id,
          },
        ]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_saves")
          .delete()
          .eq("business_id", businessId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Nu am putut actualiza salvarea business-ului:", err.message);
      setIsSaved(!nextSaved);
      alert("Nu am putut actualiza salvarea: " + err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleToggleSave()}
      disabled={isPending}
      aria-pressed={isSaved}
      className={`group flex h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border bg-black/30 px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
        isSaved
          ? "border-[#ff003c]/30 text-[#ff003c]"
          : "border-white/10 text-zinc-300 hover:border-[#ff003c]/30 hover:bg-black/40"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full transition ${
          isSaved
            ? "bg-[#ff003c]/12 text-[#ff003c]"
            : "bg-white/5 text-white group-hover:bg-[#ff003c]/12 group-hover:text-[#ff003c]"
        }`}
      >
        <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
      </span>
      <span className="text-[11px] font-medium">{isSaved ? "Salvat" : "Salveaza"}</span>
    </button>
  );
}
