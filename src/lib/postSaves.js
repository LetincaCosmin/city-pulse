export function normalizePostSaveState(post, currentUserId = null) {
  const saves = Array.isArray(post?.post_saves) ? post.post_saves : [];

  return {
    ...post,
    post_saves: saves,
    savedByUser: Boolean(currentUserId) && saves.some((save) => save.user_id === currentUserId),
  };
}

export function normalizePostsSaveState(posts = [], currentUserId = null) {
  return posts.map((post) => normalizePostSaveState(post, currentUserId));
}
