/**
 * Formatiert ein Datum relativ zur aktuellen Zeit
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "gerade eben";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `vor ${diffInMinutes} ${diffInMinutes === 1 ? "Minute" : "Minuten"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `vor ${diffInHours} ${diffInHours === 1 ? "Stunde" : "Stunden"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `vor ${diffInDays} ${diffInDays === 1 ? "Tag" : "Tagen"}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `vor ${diffInWeeks} ${diffInWeeks === 1 ? "Woche" : "Wochen"}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `vor ${diffInMonths} ${diffInMonths === 1 ? "Monat" : "Monaten"}`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `vor ${diffInYears} ${diffInYears === 1 ? "Jahr" : "Jahren"}`;
}
