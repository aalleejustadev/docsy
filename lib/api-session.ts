import { getOrganizations, getServerSession } from "@/lib/session"

/**
 * The workspace guard for route handlers.
 *
 * `lib/session.ts`'s guards `redirect()`, which is right for a page and wrong
 * for `fetch` — the browser would follow the redirect and hand JSON-expecting
 * code a page of HTML. These return a status instead.
 */
export type ApiContext = {
  userId: string
  organizationId: string
}

type ApiGuard =
  { ok: true; context: ApiContext } | { ok: false; response: Response }

export async function requireApiContext(): Promise<ApiGuard> {
  const session = await getServerSession()

  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "Not signed in." }, { status: 401 }),
    }
  }

  const organizations = await getOrganizations()
  const activeId = session.session.activeOrganizationId
  const organization =
    organizations.find((candidate) => candidate.id === activeId) ??
    organizations[0]

  if (!organization) {
    return {
      ok: false,
      response: Response.json(
        { error: "Create a workspace first." },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    context: { userId: session.user.id, organizationId: organization.id },
  }
}
