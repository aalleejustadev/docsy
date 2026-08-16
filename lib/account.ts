import { db } from "@/lib/db"

/**
 * What deleting an account has to clean up itself. Server-only.
 *
 * Better Auth's cascades reach sessions, accounts, memberships and
 * invitations — every model it owns. Nothing else in the schema hangs off
 * `user`: avatars carry a plain `userId`, and chats and documents belong to an
 * organization, which outlives its members by design. So those are removed
 * here, from `beforeDelete`, while the account is still there to scope by.
 */

/**
 * The workspaces that exist only for this user.
 *
 * A workspace with another member is somebody else's too, so it stays — the
 * user's `member` row goes with the account and the organization carries on
 * without them. Everything else is theirs alone and goes with them.
 */
async function soleOrganizationIds(userId: string) {
  const memberships = await db.member.findMany({
    where: { userId },
    select: { organizationId: true },
  })

  const organizationIds = memberships.map((member) => member.organizationId)

  if (organizationIds.length === 0) return []

  const shared = await db.member.findMany({
    where: { organizationId: { in: organizationIds }, userId: { not: userId } },
    select: { organizationId: true },
    distinct: ["organizationId"],
  })

  const sharedIds = new Set(shared.map((member) => member.organizationId))

  return organizationIds.filter((id) => !sharedIds.has(id))
}

/**
 * Removes everything the account leaves behind, in one transaction so a
 * half-deleted account can't be signed back into.
 *
 * Chats before documents, and both before the organization: `chatDocument`
 * cascades from either side, and dropping the organization first would leave
 * its documents behind — they carry a plain `organizationId` column, not a
 * relation, so Postgres won't collect them.
 */
export async function purgeUserData(userId: string) {
  const organizationIds = await soleOrganizationIds(userId)

  await db.$transaction([
    db.avatar.deleteMany({ where: { userId } }),
    db.chat.deleteMany({ where: { organizationId: { in: organizationIds } } }),
    db.document.deleteMany({
      where: { organizationId: { in: organizationIds } },
    }),
    // The allowance ledger outlives chats and documents by design, but not the
    // workspace itself — there is nothing left to meter once it's gone.
    db.questionEvent.deleteMany({
      where: { organizationId: { in: organizationIds } },
    }),
    db.organization.deleteMany({ where: { id: { in: organizationIds } } }),
  ])
}
