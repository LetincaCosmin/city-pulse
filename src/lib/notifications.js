import { supabase } from "@/lib/supabase";

export async function createNotification({
  userId = null,
  targetRole = "all",
  actorId = null,
  type = "system",
  title,
  body = "",
  href = "",
  metadata = {},
}) {
  if (!title) return;

  const { error } = await supabase.from("notifications").insert([
    {
      user_id: userId,
      target_role: targetRole,
      actor_id: actorId,
      type,
      title,
      body,
      href,
      metadata,
    },
  ]);

  if (error) {
    console.error("Nu am putut crea notificarea:", error.message);
  }
}
