-- Add a database-backed role for RBAC (customer | admin | super_admin).
-- Existing users default to 'customer'; the operator can promote specific
-- accounts to admin/super_admin via SQL or an admin management tool. The
-- env-based ADMIN_EMAIL super-admin remains authoritative as a bootstrap
-- account (checked at runtime in src/lib/api-auth.ts).

-- Add the column with a default so existing rows become 'customer'.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';
