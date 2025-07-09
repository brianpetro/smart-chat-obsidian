/**
 * Check if the last two completions contain a user message.
 * @param {object} thread
 * @returns {boolean}
 */
export function thread_has_user_message(thread) {
  const last_two = thread?.completions?.slice(-2) || [];
  return last_two.some(c => c?.data?.user_message);
}
