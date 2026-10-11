declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_PASSWORD_HASH?: string;
    SITES_LEGACY_MIGRATION?: string;
    BUCKET?: R2Bucket;
  }
}
