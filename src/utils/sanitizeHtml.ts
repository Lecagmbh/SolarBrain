import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify which handles all edge cases that regex-based
 * sanitization misses (mutation XSS, encoding tricks, etc.)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // Allow standard HTML email formatting tags
    ALLOWED_TAGS: [
      "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
      "i", "img", "li", "ol", "p", "span", "strong", "table", "tbody",
      "td", "th", "thead", "tr", "u", "ul", "blockquote", "hr", "pre",
      "code", "sup", "sub", "font", "center",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "style", "target", "rel",
      "width", "height", "border", "cellpadding", "cellspacing", "align",
      "valign", "bgcolor", "color", "size", "face",
    ],
    // Open links in new tab
    ADD_ATTR: ["target"],
    // Block javascript: URLs
    ALLOW_DATA_ATTR: false,
  });
}
