/**
 * Post-step for `npm run auth:generate`.
 *
 * The Better Auth CLI rewrites `prisma/schema.prisma` from scratch and emits a
 * Prisma 6-shaped file: the datasource carries `url = env("DATABASE_URL")` and
 * the generator has no `output`. Both are wrong here — Prisma 7 reads the URL
 * from `prisma.config.ts`, and the `prisma-client` generator refuses to run
 * without an explicit output path. Left alone, the documented
 * `auth:generate && db:migrate` workflow breaks `prisma generate`.
 *
 * This re-applies those two edits (and the header) so re-generating is safe.
 */
import { readFile, writeFile } from "node:fs/promises"

const SCHEMA_PATH = "prisma/schema.prisma"
const GENERATOR_OUTPUT = '  output   = "../generated/prisma"'

const HEADER = `// Prisma 7: the connection URL lives in \`prisma.config.ts\`, not in this file.
//
// The models below are owned by Better Auth. Re-run \`npm run auth:generate\`
// after changing plugins or auth options, then create a migration.
`

const original = await readFile(SCHEMA_PATH, "utf8")
let schema = original

// 1. Drop the datasource url — prisma.config.ts owns it.
schema = schema.replace(/^[ \t]*url\s*=\s*env\("DATABASE_URL"\)[ \t]*\r?\n/m, "")

// 2. Restore the generator output path.
if (!/^[ \t]*output\s*=/m.test(schema)) {
  schema = schema.replace(
    /^([ \t]*provider\s*=\s*"prisma-client"[ \t]*\r?\n)/m,
    `$1${GENERATOR_OUTPUT}\n`
  )
}

// 3. Restore the header comment.
if (!schema.startsWith("// Prisma 7:")) {
  schema = `${HEADER}\n${schema.replace(/^\s+/, "")}`
}

if (!/^[ \t]*output\s*=/m.test(schema)) {
  console.error(
    "sync-auth-schema: could not re-add the generator output path — check prisma/schema.prisma by hand."
  )
  process.exit(1)
}

if (schema === original) {
  console.log("sync-auth-schema: schema already correct, nothing to do.")
} else {
  await writeFile(SCHEMA_PATH, schema)
  console.log("sync-auth-schema: re-applied the Prisma 7 schema settings.")
}
