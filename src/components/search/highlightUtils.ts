/**
 * Hervorhebt den Suchbegriff im Text (case-insensitive)
 * @param text - Der Text, in dem gesucht wird
 * @param query - Der Suchbegriff
 * @returns HTML-String mit <mark> Tags um die Treffer
 */
export function highlightText(text: string, query: string): string {
  if (!query || query.trim().length < 2) {
    return escapeHtml(text);
  }

  const searchTerm = query.trim();
  const escapedText = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, "gi");

  return escapedText.replace(
    regex,
    '<mark class="bg-cyan-500/30 text-cyan-300">$1</mark>'
  );
}

/**
 * Escaped HTML-Sonderzeichen (Server-Side kompatibel)
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escaped Regex-Sonderzeichen
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
