"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  authClient,
  organization as organizationClient,
  requestPasswordReset,
  type SessionUser,
} from "@/lib/auth-client"
import { SETTINGS_ROUTE } from "@/lib/dashboard-nav"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { authErrorMessage } from "@/components/auth/auth-errors"
import { UserAvatar } from "@/components/auth/user-avatar"
import { SpinnerRing } from "@/components/common/spinner-ring"
import { AvatarUploadDialog } from "@/components/dashboard/settings/avatar-upload-dialog"

type Workspace = {
  id: string
  name: string
}

/**
 * The Account tab — `ui-design/dashboard/light/dashboard-settings-page.png`.
 *
 * Three fields, three different writes: the name is a user update, the
 * organization is an organization update, and the email can't be written on
 * the spot at all — Better Auth mails a link to the new address, and the
 * change lands when that link is opened. Save sends only what changed.
 */
function AccountSettings({
  user,
  workspace,
}: {
  user: SessionUser
  workspace: Workspace
}) {
  const router = useRouter()

  const [name, setName] = React.useState(user.name ?? "")
  const [organizationName, setOrganizationName] = React.useState(workspace.name)
  const [email, setEmail] = React.useState(user.email)

  /** An address we've mailed a link to, still waiting to be confirmed. */
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)

  const [saving, setSaving] = React.useState(false)
  const [removingAvatar, setRemovingAvatar] = React.useState(false)
  const [sendingReset, setSendingReset] = React.useState(false)

  const trimmed = {
    name: name.trim(),
    organizationName: organizationName.trim(),
    email: email.trim(),
  }

  const changed = {
    name: trimmed.name !== (user.name ?? "").trim(),
    organizationName: trimmed.organizationName !== workspace.name.trim(),
    email: trimmed.email.toLowerCase() !== user.email.toLowerCase(),
  }

  const isDirty = Object.values(changed).some(Boolean)
  const isEmpty = Object.values(trimmed).some((value) => value.length === 0)

  function reset() {
    setName(user.name ?? "")
    setOrganizationName(workspace.name)
    setEmail(user.email)
    setPendingEmail(null)
  }

  /**
   * Server components read the session, and the cookie cache can hold the old
   * copy for minutes — so force a fresh read before refreshing the tree, or
   * the sidebar keeps showing the previous name.
   */
  async function refreshServerState() {
    await authClient.getSession({ query: { disableCookieCache: true } })
    router.refresh()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isDirty || isEmpty) return

    setSaving(true)

    if (changed.name) {
      const { error } = await authClient.updateUser({ name: trimmed.name })

      if (error) {
        setSaving(false)
        toast.add({
          type: "error",
          title: "Couldn't save your name",
          description: authErrorMessage(error, "Please try again."),
        })
        return
      }
    }

    if (changed.organizationName) {
      const { error } = await organizationClient.update({
        organizationId: workspace.id,
        data: { name: trimmed.organizationName },
      })

      if (error) {
        setSaving(false)
        toast.add({
          type: "error",
          title: "Couldn't rename the workspace",
          description: authErrorMessage(error, "Please try again."),
        })
        return
      }
    }

    if (changed.email) {
      const { error } = await authClient.changeEmail({
        newEmail: trimmed.email,
        callbackURL: SETTINGS_ROUTE,
      })

      if (error) {
        setSaving(false)
        // The name and organization are already saved at this point, so say so
        // rather than implying the whole save failed.
        toast.add({
          type: "error",
          title: "Couldn't change your email",
          description: authErrorMessage(error, "Please try again."),
        })
        setEmail(user.email)
        await refreshServerState()
        return
      }

      setPendingEmail(trimmed.email)
    }

    await refreshServerState()
    setSaving(false)

    toast.add({
      type: "success",
      title: "Settings saved",
      description: changed.email
        ? `Open the link we sent to ${trimmed.email} to finish the switch.`
        : undefined,
    })
  }

  async function handleAvatarUploaded() {
    await refreshServerState()
    toast.add({ type: "success", title: "Profile picture updated" })
  }

  async function handleRemoveAvatar() {
    setRemovingAvatar(true)
    // Through the route rather than `updateUser`, so the stored bytes go too
    // instead of lingering behind a URL nothing points at.
    const response = await fetch("/api/avatar", { method: "DELETE" })
    setRemovingAvatar(false)

    if (!response.ok) {
      toast.add({
        type: "error",
        title: "Couldn't remove your picture",
        description: "Please try again.",
      })
      return
    }

    await refreshServerState()
    toast.add({ type: "success", title: "Profile picture removed" })
  }

  async function handleChangePassword() {
    setSendingReset(true)
    const { error } = await requestPasswordReset({
      email: user.email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSendingReset(false)

    if (error) {
      toast.add({
        type: "error",
        title: "Couldn't send the link",
        description: authErrorMessage(error, "Please try again."),
      })
      return
    }

    toast.add({
      type: "success",
      title: "Check your inbox",
      description: `We sent a link to ${user.email} to set a new password.`,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile</CardTitle>
          <CardDescription>
            This information appears on your account and exports.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} className="size-12 text-base" />

            <AvatarUploadDialog onUploaded={handleAvatarUploaded}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="cursor-pointer"
              >
                Upload new
              </Button>
            </AvatarUploadDialog>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="cursor-pointer text-muted-foreground"
              disabled={!user.image || removingAvatar}
              onClick={handleRemoveAvatar}
            >
              {removingAvatar && <SpinnerRing />}
              Remove
            </Button>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="full-name">Full name</FieldLabel>
              <Input
                id="full-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                maxLength={64}
                disabled={saving}
                className="h-9"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="organization">Organization</FieldLabel>
              <Input
                id="organization"
                name="organization"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                autoComplete="organization"
                required
                maxLength={64}
                disabled={saving}
                className="h-9"
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={saving}
                className="h-9"
              />
              {changed.email &&
                (pendingEmail === trimmed.email ? (
                  <p className="text-sm text-muted-foreground">
                    Waiting on the link we sent to {trimmed.email}. Until
                    it&apos;s opened, {user.email} stays your sign-in.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Saving sends a confirmation link to {trimmed.email}. Your
                    sign-in address changes once you open it.
                  </p>
                ))}
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Password</CardTitle>
          <CardDescription>Change your password anytime.</CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="cursor-pointer"
            disabled={sendingReset}
            onClick={handleChangePassword}
          >
            {sendingReset ? <SpinnerRing /> : null}
            Change password
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="cursor-pointer px-4"
          disabled={!isDirty || saving}
          onClick={reset}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          size="lg"
          className="cursor-pointer gap-2 px-4"
          disabled={!isDirty || isEmpty || saving}
        >
          {saving && <SpinnerRing />}
          Save changes
        </Button>
      </div>
    </form>
  )
}

export { AccountSettings }
