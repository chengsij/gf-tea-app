/**
 * Formats a timestamp for display on tea cards.
 * Returns "Today" if same day, otherwise "MMM DD, YYYY" format.
 */
export const formatLastConsumedDate = (timestamp: number | null): string => {
  if (timestamp === null) {
    return 'Never';
  }

  const date = new Date(timestamp);
  const today = new Date();

  // Check if same day
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isSameDay) {
    return 'Today';
  }

  // Format as "Jan 20, 2026"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
