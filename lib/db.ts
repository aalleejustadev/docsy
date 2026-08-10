import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "@/generated/prisma/client"

/**
 * Prisma 7 talks to Postgres through a driver adapter; ours is Neon's
 * serverless driver, which speaks HTTP/WebSocket instead of raw TCP and so
 * survives the short-lived connections a serverless deploy hands out.
 */
function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  })
}

// Dev hot-reload re-evaluates modules on every edit; without this the process
// accumulates a new pool per reload until Neon starts refusing connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>
}

const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

export { db }
