import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { generatedPassword, MIN_CREATED_PASSWORD_LENGTH } from "@/lib/admin"
import {
  describePlanGranted,
  describeUserCreated,
  LOG_ACTIONS,
} from "@/lib/admin-log"
import { actorNameFor, recordAdminLog } from "@/lib/admin-log-store"
import { requireApiAdmin } from "@/lib/api-session"
import { auth } from "@/lib/auth"
import { isPaidPlanId, type PlanId } from "@/lib/billing"
import { grantPlan } from "@/lib/billing-store"
import { db } from "@/lib/db"
import { organizationSlug, uniqueSlugSuffix } from "@/lib/organization"

/**
 * Creates a user from the admin console — `admin-add-user-page.png`.
 *
 * Three things happen, in this order, and the order matters: the account, then
 * a workspace for it, then the plan if one was chosen. A user without a
 * workspace can't reach the product (they'd land on onboarding), and a plan is
 * held by a workspace, so "create an account on Business" isn't expressible
 * until the first two exist.
 *
 * Every check is server-side. `requireApiAdmin` is the only thing standing
 * between this endpoint and a stranger creating themselves a Business account,
 * so nothing here reads a role, a plan or an id out of the request body except
 * as a value to validate.
 */

/** Slug collisions are possible but rare; a couple of retries is plenty. */
const SLUG_ATTEMPTS = 3

/** "Ada Lovelace" → "Ada Lovelace's workspace". */
function workspaceNameFor(name: string) {
  return `${name}${name.endsWith("s") ? "'" : "'s"} workspace`
}

/**
 * Creates the workspace the new account will land in, retrying past a taken
 * slug. Better Auth's own endpoint is used rather than a direct insert so the
 * owner membership is written the way the rest of the app expects.
 *
 * Called deliberately *without* headers. `body.userId` is only honoured when
 * the endpoint sees no session — with the admin's cookies attached, Better Auth
 * treats the admin as the creator and hands them the workspace, which is how
 * this went wrong the first time: the new user got no workspace and the plan
 * landed on the admin's own membership.
 *
 * Passing no session makes this a system action, which means Better Auth does
 * no permission check of its own here. `requireApiAdmin()` at the top of the
 * handler is the check, and it has to stay there.
 */
async function createWorkspaceFor(userId: string, name: string) {
  const base = organizationSlug(name)

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${uniqueSlugSuffix()}`

    try {
      return await auth.api.createOrganization({
        body: {
          name: workspaceNameFor(name),
          slug,
          // Owned by the new user — see above for why there are no headers.
          userId,
        },
      })
    } catch (error) {
      const taken = String(error).toLowerCase().includes("slug")

      if (!taken || attempt === SLUG_ATTEMPTS - 1) throw error
    }
  }

  return null
}

export async function POST(request: Request) {
  const guard = await requireApiAdmin()
  if (!guard.ok) return guard.response

  const body = (await request.json().catch(() => null)) as {
    name?: string
    email?: string
    password?: string
    planId?: string
  } | null

  const name = body?.name?.trim() ?? ""
  const email = body?.email?.trim().toLowerCase() ?? ""
  const requestedPassword = body?.password ?? ""
  const planId = (body?.planId ?? "free") as PlanId

  if (!name) {
    return NextResponse.json({ error: "Enter a username." }, { status: 400 })
  }

  // Deliberately loose: the address has to survive a round trip through an
  // inbox, and this endpoint isn't the place to litigate what an address may
  // look like. Better Auth rejects what it can't use.
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    )
  }

  if (planId !== "free" && !isPaidPlanId(planId)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 })
  }

  if (
    requestedPassword &&
    requestedPassword.length < MIN_CREATED_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      {
        error: `A password needs at least ${MIN_CREATED_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    )
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: "Somebody already has that email address." },
      { status: 409 }
    )
  }

  // Blank means "auto-generated", as the field's placeholder promises. It's
  // returned to the admin once, in the response, and never stored in the clear.
  const password = requestedPassword || generatedPassword()
  const wasGenerated = !requestedPassword

  let created
  try {
    created = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        // Everyone made here is a plain user. Promoting somebody to admin is a
        // separate, deliberate act — not a dropdown on a creation form.
        role: "user",
      },
      headers: await headers(),
    })
  } catch (error) {
    console.error("[admin] createUser failed", error)

    return NextResponse.json(
      { error: "Couldn't create that account." },
      { status: 502 }
    )
  }

  const userId = created.user.id
  const actorName = await actorNameFor(guard.userId)

  await recordAdminLog({
    action: LOG_ACTIONS.userCreated,
    description: describeUserCreated(email, planId),
    actorId: guard.userId,
    actorName,
    targetId: userId,
  })

  try {
    const organization = await createWorkspaceFor(userId, name)

    // Only a paid plan is a grant; `free` is what every workspace already is,
    // and writing a row for it would invent an entitlement out of a default.
    if (organization && planId !== "free") {
      await grantPlan({
        organizationId: organization.id,
        planId,
        grantedByUserId: guard.userId,
      })

      // Logged separately from the account: comping a plan is its own decision,
      // and an auditor reading the log should see it as one.
      await recordAdminLog({
        action: LOG_ACTIONS.planGranted,
        description: describePlanGranted(name, planId),
        actorId: guard.userId,
        actorName,
        targetId: userId,
      })
    }
  } catch (error) {
    // The account exists and can sign in; it just has no workspace yet, which
    // onboarding will ask them for. Worth saying so rather than implying the
    // whole thing failed.
    console.error("[admin] workspace setup failed", error)

    return NextResponse.json(
      {
        userId,
        email,
        password: wasGenerated ? password : null,
        warning:
          "The account was created, but its workspace wasn't. They'll be asked to name one when they first sign in.",
      },
      { status: 207 }
    )
  }

  return NextResponse.json({
    userId,
    email,
    // Shown to the admin once so they can pass it on — there is nowhere else to
    // read it from afterwards.
    password: wasGenerated ? password : null,
    planId,
  })
}
