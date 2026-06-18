export function normalizePostLikeState(post, currentUserId = null) {
  const likes = Array.isArray(post?.post_likes) ? post.post_likes : [];

  return {
    ...post,
    post_likes: likes,
    likesCount: likes.length,
    likedByUser: Boolean(currentUserId) && likes.some((like) => like.user_id === currentUserId),
  };
}

export function normalizePostsLikeState(posts = [], currentUserId = null) {
  return posts.map((post) => normalizePostLikeState(post, currentUserId));
}

export function getPostLikeLabel(likesCount = 0) {
  return likesCount === 1 ? "1 like" : `${likesCount} like-uri`;
}
