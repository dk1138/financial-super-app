const ALLOWED_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'br',
  'p',
  'ul',
  'ol',
  'li',
  'code',
  'span',
  'small',
  'hr',
]);

/**
 * Lightweight HTML allowlist sanitizer for static/rich tooltip strings.
 * Strips dangerous elements, event handlers, and scriptable URLs while keeping basic formatting tags.
 */
export function sanitizeTooltipHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Remove script/style/iframe/object/embed blocks including their contents
  let clean = html.replace(
    /<\s*(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ''
  );

  // Strip or sanitize individual HTML tags
  clean = clean.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';

    const isClosing = match.startsWith('</');
    if (isClosing) return `</${tag}>`;

    // Only allow safe class attributes on allowed tags; strip event handlers (on*) and style/href/src
    const classMatch = rawAttrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const safeClass = classMatch
      ? (classMatch[1] ?? classMatch[2] ?? '').replace(/[^a-zA-Z0-9_\-\s]/g, '')
      : '';

    const selfClosing = tag === 'br' || tag === 'hr' ? ' /' : '';
    return safeClass ? `<${tag} class="${safeClass}"${selfClosing}>` : `<${tag}${selfClosing}>`;
  });

  return clean;
}
