import DOMPurify from "dompurify";

/** Sanitize CMS-authored HTML before it reaches React's HTML sink. */
export function sanitizeHtml(html: string | null | undefined): string {
  return DOMPurify.sanitize(html ?? "", { USE_PROFILES: { html: true } });
}
