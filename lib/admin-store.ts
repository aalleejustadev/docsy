import {
  ADMIN_ACTIVE_WINDOW_DAYS,
  ADMIN_TOP_USERS,
  ADMIN_USERS_PAGE_SIZE,
  isAdminRole,
  type AdminActiveUser,
  type AdminOverview,
  type AdminUserRow,
  type AdminUsersView,
  type AdminUserStatus,
} from "@/lib/admin"
import { ENTITLED_STATUSES, type PlanId } from "@/lib/billing"
import { db } from "@/lib/db"
import { clampPage } from "@/lib/pagination"

/**
 * The admin console's reads. Server-only, and deliberately unscoped: every
 * other store in this codebase filters by `organizationId` because a workspace
 * is the tenancy boundary, and this one is the single place that reads across
 * all of them. Guard every caller with `requireAdmin()`.
 */

/** Midnight on the 1st — the same window the question allowance resets on. */
function monthStart(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function activitySince(now: Date) {
  return new Date(now.getTime() - ADMIN_ACTIVE_WINDOW_DAYS * 86_400_000)
}

/**
 * How many people are entitled to a paid plan.
 *
 * Counted in people rather than subscriptions: a subscription belongs to a
 * workspace, and the tile sits beside a total of user accounts, so counting
 * rows would compare two different things. Members are de-duplicated, so
 * somebody in two paid workspaces is still one paid subscriber.
 */
async function countPaidSubscribers() {
  const paidWorkspaces = await db.subscription.findMany({
    where: { status: { in: [...ENTITLED_STATUSES] } },
    select: { organizationId: true },
  })

  if (paidWorkspaces.length === 0) return 0

  const members = await db.member.findMany({
    where: {
      organizationId: { in: paidWorkspaces.map((row) => row.organizationId) },
    },
    distinct: ["userId"],
    select: { userId: true },
  })

  return members.length
}

/**
 * People who signed in or asked something inside the window.
 *
 * Two signals unioned, because either one alone lies: sessions expire and get
 * cleaned up, so they undercount, and plenty of people sign in without asking
 * anything. This is the figure the Users tab's "Inactive" badge will invert.
 */
async function countActiveUsers(since: Date) {
  const [signedIn, asked] = await Promise.all([
    db.session.findMany({
      where: { updatedAt: { gte: since } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.questionEvent.findMany({
      where: { createdAt: { gte: since } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ])

  const ids = new Set(signedIn.map((row) => row.userId))
  for (const row of asked) ids.add(row.userId)

  return ids.size
}

/** The busiest people this month, resolved to names and avatars. */
async function listMostActiveUsers(since: Date): Promise<AdminActiveUser[]> {
  const byUser = await db.questionEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: ADMIN_TOP_USERS,
  })

  if (byUser.length === 0) return []

  const users = await db.user.findMany({
    where: { id: { in: byUser.map((row) => row.userId) } },
    select: { id: true, name: true, email: true, image: true },
  })

  const byId = new Map(users.map((user) => [user.id, user]))

  return (
    byUser
      // A deleted account keeps its question events — they're the billing
      // record — but has no name to show, so it drops out of the list.
      .filter((row) => byId.has(row.userId))
      .map((row) => {
        const user = byId.get(row.userId)!

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          questions: row._count._all,
        }
      })
  )
}

/** Everything the Overview tab shows, in one round of queries. */
export async function getAdminOverview(
  now: Date = new Date()
): Promise<AdminOverview> {
  const since = monthStart(now)
  const activeSince = activitySince(now)

  const [
    documentsIndexed,
    questionsThisMonth,
    totalUsers,
    activeUsers,
    paidSubscribers,
    mostActive,
  ] = await Promise.all([
    db.document.count({ where: { status: "READY" } }),
    db.questionEvent.count({ where: { createdAt: { gte: since } } }),
    db.user.count(),
    countActiveUsers(activeSince),
    countPaidSubscribers(),
    listMostActiveUsers(since),
  ])

  return {
    documentsIndexed,
    questionsThisMonth,
    activeUsers,
    paidSubscribers,
    totalUsers,
    mostActive,
  }
}

/* -------------------------------------------------------------------------
 * Users tab
 * ---------------------------------------------------------------------- */

/** Ranked worst-to-best, so a person in two workspaces shows the better plan. */
const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 }

/**
 * The best plan each of these users is entitled to.
 *
 * Read through the workspaces they belong to rather than off the user, because
 * a plan is bought by a workspace — and only an entitled subscription counts,
 * the same rule the product enforces everywhere else.
 */
async function plansByUser(userIds: string[]) {
  const plans = new Map<string, PlanId>()

  if (userIds.length === 0) return plans

  const memberships = await db.member.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, organizationId: true },
  })

  if (memberships.length === 0) return plans

  const paid = await db.subscription.findMany({
    where: {
      organizationId: {
        in: memberships.map((membership) => membership.organizationId),
      },
      status: { in: [...ENTITLED_STATUSES] },
    },
    select: { organizationId: true, planId: true },
  })

  const planByOrganization = new Map(
    paid.map((row) => [row.organizationId, row.planId as PlanId])
  )

  for (const membership of memberships) {
    const plan = planByOrganization.get(membership.organizationId)

    if (!plan) continue

    const held = plans.get(membership.userId) ?? "free"

    if (PLAN_RANK[plan] > PLAN_RANK[held]) plans.set(membership.userId, plan)
  }

  return plans
}

/**
 * When each of these users was last seen.
 *
 * The later of two signals: their most recent session — which is what a
 * sign-in leaves behind — and their most recent question. Neither alone is the
 * answer, since sessions get cleaned up and plenty of people never ask
 * anything.
 */
async function lastActiveByUser(userIds: string[]) {
  const seen = new Map<string, Date>()

  if (userIds.length === 0) return seen

  const [sessions, questions] = await Promise.all([
    db.session.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { updatedAt: true },
    }),
    db.questionEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { createdAt: true },
    }),
  ])

  const record = (userId: string, at: Date | null) => {
    if (!at) return

    const held = seen.get(userId)
    if (!held || at > held) seen.set(userId, at)
  }

  for (const row of sessions) record(row.userId, row._max.updatedAt)
  for (const row of questions) record(row.userId, row._max.createdAt)

  return seen
}

function userStatus(
  banned: boolean,
  lastActive: Date | undefined,
  activeSince: Date
): AdminUserStatus {
  // A ban is a decision and outranks any amount of recent activity.
  if (banned) return "deactivated"

  return lastActive && lastActive >= activeSince ? "active" : "inactive"
}

/**
 * One page of the Users table — `admin-users-page.png`.
 *
 * Ordered newest account first, so somebody who just signed up is on the page
 * an admin is already looking at. The search covers name and email, which are
 * the two things an admin has when they go looking for a person.
 */
export async function getAdminUsers({
  query = "",
  page = 1,
  now = new Date(),
}: {
  query?: string
  page?: number
  now?: Date
} = {}): Promise<AdminUsersView> {
  const search = query.trim()
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const total = await db.user.count({ where })
  const { page: current, pageCount } = clampPage(
    page,
    total,
    ADMIN_USERS_PAGE_SIZE
  )

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * ADMIN_USERS_PAGE_SIZE,
    take: ADMIN_USERS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
    },
  })

  const ids = users.map((user) => user.id)
  const activeSince = activitySince(now)

  // Both lookups are scoped to the page's own rows, so the cost of the table
  // doesn't grow with the size of the user base.
  const [plans, lastActive] = await Promise.all([
    plansByUser(ids),
    lastActiveByUser(ids),
  ])

  const rows: AdminUserRow[] = users.map((user) => {
    const seen = lastActive.get(user.id)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      planId: plans.get(user.id) ?? "free",
      status: userStatus(user.banned ?? false, seen, activeSince),
      lastActive: seen?.toISOString() ?? null,
      isAdmin: isAdminRole(user.role),
    }
  })

  return { users: rows, total, page: current, pageCount }
}
