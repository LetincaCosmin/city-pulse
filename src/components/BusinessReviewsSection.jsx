"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareText, Send, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import {
  calculateBusinessReviewSummary,
  formatBusinessReviewDate,
  getAuthorInitial,
} from "@/lib/businessReviews";

function StarPicker({ rating, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value)}
          className="rounded-md p-1 text-zinc-500 transition-colors hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${value} stele`}
        >
          <Star
            size={20}
            className={value <= rating ? "text-amber-300" : "text-zinc-600"}
            fill={value <= rating ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewComposer({
  user,
  ownReview,
  businessId,
  businessName,
  businessOwnerId,
  isLiveBusiness,
  isBusinessOwner,
  onReviewSaved,
  onReviewDeleted,
}) {
  const [rating, setRating] = useState(() => ownReview?.rating || 5);
  const [comment, setComment] = useState(() => ownReview?.comment || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!user) {
      setErrorMsg("Trebuie sa fii conectat ca sa lasi o recenzie.");
      return;
    }

    if (!isLiveBusiness) {
      setErrorMsg("Recenziile sunt disponibile doar pentru business-urile publicate live.");
      return;
    }

    if (isBusinessOwner) {
      setErrorMsg("Nu poti lasa recenzie propriului business.");
      return;
    }

    if (!comment.trim()) {
      setErrorMsg("Scrie cateva cuvinte despre experienta ta.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        business_id: businessId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
      };

      const { data, error } = await supabase
        .from("business_reviews")
        .upsert([payload], { onConflict: "business_id,user_id" })
        .select("*")
        .single();

      if (error) throw error;

      const hydratedReview = {
        ...data,
        authorName: user.name || user.email?.split("@")[0] || "Utilizator City Pulse",
        authorAvatarUrl: user.avatarUrl || null,
        authorInitial: getAuthorInitial(
          user.name || user.email?.split("@")[0] || "Utilizator",
        ),
      };

      onReviewSaved(hydratedReview);
      setInfoMsg(
        ownReview ? "Recenzia ta a fost actualizata." : "Recenzia ta a fost publicata.",
      );

      await createNotification({
        userId: businessOwnerId,
        actorId: user.id,
        type: "review",
        title: ownReview
          ? "Ai primit o recenzie actualizata"
          : "Ai primit o recenzie noua",
        body: `${user.name || "Un utilizator"} a lasat ${rating} stele pentru ${businessName}.`,
        href: `/business/${businessId}`,
        metadata: {
          businessId,
          rating,
        },
      });
    } catch (error) {
      setErrorMsg(
        error.message || "Nu am putut salva recenzia. Incearca din nou.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview) return;

    setDeleting(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const { error } = await supabase
        .from("business_reviews")
        .delete()
        .eq("id", ownReview.id);

      if (error) throw error;

      onReviewDeleted(ownReview.id);
      setRating(5);
      setComment("");
      setInfoMsg("Recenzia ta a fost stearsa.");
    } catch (error) {
      setErrorMsg(
        error.message || "Nu am putut sterge recenzia. Incearca din nou.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {infoMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          {infoMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="mb-4 rounded-3xl bg-[#101014] p-4 ring-1 ring-white/10">
        {!isLiveBusiness ? (
          <p className="text-sm font-light leading-relaxed text-zinc-500">
            Pentru business-urile demo afisam doar ratingurile de prezentare. Recenziile live
            se activeaza pentru business-urile publicate din cont real.
          </p>
        ) : !user ? (
          <p className="text-sm font-light leading-relaxed text-zinc-500">
            Ca sa lasi o recenzie trebuie sa fii conectat.
            {" "}
            <Link href="/login" className="font-medium text-[#ff003c] hover:text-white">
              Intra in cont
            </Link>
            .
          </p>
        ) : isBusinessOwner ? (
          <p className="text-sm font-light leading-relaxed text-zinc-500">
            Aici vor aparea recenziile lasate de utilizatori pentru business-ul tau.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">
                {ownReview ? "Editeaza recenzia ta" : "Lasa o recenzie"}
              </p>
              <StarPicker rating={rating} onChange={setRating} disabled={saving} />
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Cum a fost experienta ta aici?"
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-light text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#ff003c]/40"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-[#ff003c] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d60032] disabled:cursor-not-allowed disabled:bg-zinc-800"
              >
                <Send size={15} />
                {saving
                  ? "Se salveaza..."
                  : ownReview
                    ? "Actualizeaza recenzia"
                    : "Publica recenzia"}
              </button>

              {ownReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  {deleting ? "Se sterge..." : "Sterge"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export default function BusinessReviewsSection({
  businessId,
  businessName,
  businessOwnerId,
  initialReviews = [],
  fallbackSummary = {},
  isLiveBusiness = true,
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const ownReview = user
    ? reviews.find((review) => review.user_id === user.id) || null
    : null;
  const summary = calculateBusinessReviewSummary(reviews, fallbackSummary);
  const isBusinessOwner = user?.id === businessOwnerId;

  const upsertReviewInState = (nextReview) => {
    setReviews((currentReviews) => {
      const withoutOwnReview = currentReviews.filter(
        (review) => review.user_id !== nextReview.user_id,
      );

      return [nextReview, ...withoutOwnReview].sort(
        (left, right) => new Date(right.created_at) - new Date(left.created_at),
      );
    });
  };

  return (
    <section className="mb-6" id="recenzii">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Recenzii</h2>
        <span className="text-[11px] text-zinc-500">
          {summary.reviewCount} publicate
        </span>
      </div>

      <div className="mb-4 rounded-3xl bg-[#101014] p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold text-white">
              {summary.ratingLabel}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {summary.reviewCount > 0
                ? `${summary.reviewCount} recenzii de la comunitate`
                : "Fii primul care lasa o recenzie"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                size={18}
                className={
                  summary.averageRating && value <= Math.round(summary.averageRating)
                    ? "text-amber-300"
                    : "text-zinc-700"
                }
                fill={
                  summary.averageRating && value <= Math.round(summary.averageRating)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <ReviewComposer
        key={ownReview?.id || user?.id || "guest"}
        user={user}
        ownReview={ownReview}
        businessId={businessId}
        businessName={businessName}
        businessOwnerId={businessOwnerId}
        isLiveBusiness={isLiveBusiness}
        isBusinessOwner={isBusinessOwner}
        onReviewSaved={upsertReviewInState}
        onReviewDeleted={(reviewId) => {
          setReviews((currentReviews) =>
            currentReviews.filter((review) => review.id !== reviewId),
          );
        }}
      />

      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-3xl bg-[#101014] p-4 ring-1 ring-white/10"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#ff003c]/10 text-sm font-semibold text-[#ff003c] ring-1 ring-[#ff003c]/20">
                    {review.authorAvatarUrl ? (
                      <img
                        src={review.authorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      review.authorInitial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {review.authorName}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatBusinessReviewDate(review.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={14}
                      className={
                        value <= review.rating ? "text-amber-300" : "text-zinc-700"
                      }
                      fill={value <= review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm font-light leading-relaxed text-zinc-400">
                {review.comment}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm font-light text-zinc-500">
            Inca nu exista recenzii pentru acest business.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-500">
        <MessageSquareText size={15} className="text-[#ff003c]" />
        O singura recenzie per utilizator, dar o poti edita oricand.
      </div>
    </section>
  );
}
