// Set at build time for a subdirectory deployment; empty preserves the Sites preview.
export const APP_BASE_PATH = process.env.NEXT_PUBLIC_APP_BASE_PATH || '';
export const APP_COOKIE_PATH = APP_BASE_PATH || '/';
export function appPath(path: string) { return APP_BASE_PATH + path; }
