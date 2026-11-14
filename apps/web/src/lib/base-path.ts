/**
 * The path this AutoSort is served under, from BASE_PATH at build time (for example "/autosort"
 * when another site shows it at example.com/autosort). Empty when it runs at the root.
 */
export const BASE_PATH = process.env.AUTOSORT_BASE_PATH ?? '';

/**
 * Prefix a root-relative path with the base path. Needed for plain <a> links to API routes, form
 * actions and image src; next/link, redirect() and the router add it on their own.
 */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
