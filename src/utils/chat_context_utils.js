/**
 * Determine if the given completion is the last in the thread.
 * @param {object} thread
 * @param {object} completion
 * @returns {boolean}
 */
export function is_last_completion(thread, completion) {
  if (!thread || !completion) return false;
  const last = thread?.completions?.[thread.completions.length - 1];
  return last?.key === completion.key;
}

/**
 * Check if the last two completions contain a user message.
 * @param {object} thread
 * @returns {boolean}
 */
export function thread_has_user_message(thread) {
  const last_two = thread?.completions?.slice(-2) || [];
  return last_two.some(c => c?.data?.user_message);
}
