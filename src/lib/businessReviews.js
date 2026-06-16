export function calculateBusinessReviewSummary(
  reviewRows = [],
  fallback = {},
) {
  const validRatings = reviewRows
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);

  if (validRatings.length === 0) {
    const fallbackRating =
      fallback?.rating && fallback.rating !== "Nou"
        ? Number(fallback.rating)
        : null;

    return {
      averageRating: fallbackRating,
      ratingLabel: fallbackRating ? fallbackRating.toFixed(1) : "Nou",
      reviewCount: fallback?.reviews || 0,
      hasLiveReviews: false,
    };
  }

  const averageRating =
    validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    ratingLabel: averageRating.toFixed(1),
    reviewCount: validRatings.length,
    hasLiveReviews: true,
  };
}

export function formatBusinessReviewDate(value) {
  if (!value) return "recent";

  try {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "recent";
  }
}

export function getAuthorInitial(name = "") {
  return name.trim().charAt(0).toUpperCase() || "U";
}
