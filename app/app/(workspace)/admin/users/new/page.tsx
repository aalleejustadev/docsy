import type { Metadata } from "next"

import { requireAdmin } from "@/lib/session"
import { AdminCreateUserForm } from "@/components/admin/users/admin-create-user-form"

export const metadata: Metadata = {
  title: "Add user · Admin",
}

/**
 * `/app/admin/users/new` — the Add user tab.
 *
 * Guarded here as well as in the console layout: layouts and pages render
 * concurrently, so this is what keeps the form off a non-admin's screen. The
 * form's endpoint checks the role again, which is the check that actually
 * matters — this one only decides what gets rendered.
 */
export default async function AdminAddUserPage() {
  await requireAdmin()

  return (
    <div className="max-w-160 rounded-xl border bg-card p-6">
      <AdminCreateUserForm />
    </div>
  )
}
