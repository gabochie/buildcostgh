/**
 * Shared agent identifiers for the audit log. Kept out of any single agent
 * module so modules (content-engine ↔ social) never import each other
 * circularly just to share a constant.
 */
export const CONTENT_AGENT = "ContentBot"