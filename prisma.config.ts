import "dotenv/config"
import { defineConfig } from "prisma/config"

/**
 * The URL the Prisma CLI uses — migrations, studio, diff. The running app never
 * uses it; that connects through the Neon adapter in `lib/db.ts`.
 *
 * Migrations need a *direct* (unpooled) connection: Neon's pooled endpoint goes
 * through pgBouncer in transaction mode, which can't run DDL in a transaction
 * and fails with things like `prepared statement "s0" already exists`.
 *
 * `DATABASE_URL_UNPOOLED` comes first because that's the name `neon env pull`
 * writes; `DIRECT_URL` is the Prisma convention and is kept as an alias.
 */
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL

if (migrationUrl?.includes("-pooler.")) {
  console.warn(
    "[prisma.config] Using a pooled Neon URL for CLI commands. Set DATABASE_URL_UNPOOLED " +
      "(or DIRECT_URL) to the endpoint without the `-pooler` suffix, or migrations may fail."
  )
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
})
