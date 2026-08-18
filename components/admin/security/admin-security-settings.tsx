"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  retentionToValue,
  RETENTION_OPTIONS,
  TOGGLE_SETTINGS,
  type AppSettings,
  type ToggleSettingKey,
} from "@/lib/app-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

/** What a save sends: one changed control, never the whole form. */
type SettingsPatch = {
  allowSignUps?: boolean
  enforceTwoFactor?: boolean
  maintenanceMode?: boolean
  chatRetention?: string
}

/**
 * The Security tab — `ui-design/dashboard/light/admin-security-page.png`.
 *
 * Saves on change rather than behind a button: these are switches, and a switch
 * that needs confirming isn't one. The optimistic flip is rolled back if the
 * request fails, so the control never shows a state the server didn't accept.
 */
function AdminSecuritySettings({ settings }: { settings: AppSettings }) {
  const router = useRouter()
  const [current, setCurrent] = React.useState(settings)
  const [saving, setSaving] = React.useState<string | null>(null)

  // The server is the source of truth: a refresh brings new props, and they win
  // over whatever this component last flipped to.
  const [seen, setSeen] = React.useState(settings)
  if (settings !== seen) {
    setSeen(settings)
    setCurrent(settings)
  }

  async function save(patch: SettingsPatch, field: string, revert: () => void) {
    setSaving(field)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        revert()
        toast.add({
          type: "error",
          title: "Couldn't save that.",
          description: payload?.error ?? "Try again in a moment.",
        })
        return
      }

      if (typeof payload?.deleted === "number" && payload.deleted > 0) {
        toast.add({
          type: "success",
          title: `Deleted ${payload.deleted} chat${payload.deleted === 1 ? "" : "s"}.`,
          description: "They were older than the new retention window.",
        })
      }

      // Maintenance mode and sign-ups change what other pages render, so the
      // tree is re-fetched rather than left showing the old world.
      router.refresh()
    } catch {
      revert()
      toast.add({
        type: "error",
        title: "Couldn't save that.",
        description: "Check your connection and try again.",
      })
    } finally {
      setSaving(null)
    }
  }

  function toggle(key: ToggleSettingKey, next: boolean) {
    const previous = current[key]

    setCurrent((held) => ({ ...held, [key]: next }))
    save({ [key]: next }, key, () =>
      setCurrent((held) => ({ ...held, [key]: previous }))
    )
  }

  function setRetention(value: string | null) {
    // Base UI's Select reports a cleared value as null. This one always has a
    // selection — "Keep for ever" is an option, not the absence of one — so
    // there is nothing to save.
    if (value === null) return

    const previous = current.chatRetentionMonths

    setCurrent((held) => ({
      ...held,
      chatRetentionMonths:
        value === "never" ? null : Number.parseInt(value, 10),
    }))
    save({ chatRetention: value }, "chatRetention", () =>
      setCurrent((held) => ({ ...held, chatRetentionMonths: previous }))
    )
  }

  return (
    <div className="flex max-w-160 flex-col gap-6">
      <Card className="gap-0 py-0">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-base font-semibold">
            Access &amp; authentication
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col p-0">
          {TOGGLE_SETTINGS.map((setting, index) => (
            <React.Fragment key={setting.key}>
              {index > 0 && <Separator />}

              <Field
                orientation="horizontal"
                className="gap-6 px-6 py-4"
                data-disabled={setting.unavailable ? true : undefined}
              >
                <FieldContent>
                  <FieldTitle>{setting.title}</FieldTitle>
                  <FieldDescription>
                    {setting.unavailable ?? setting.description}
                  </FieldDescription>
                </FieldContent>

                <Switch
                  checked={current[setting.key]}
                  onCheckedChange={(next) => toggle(setting.key, next)}
                  // An unenforceable switch stays off and stays disabled: see
                  // `unavailable` in lib/app-settings.
                  disabled={
                    Boolean(setting.unavailable) || saving === setting.key
                  }
                  aria-label={setting.title}
                />
              </Field>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-6">
          {/* `responsive` needs a FieldGroup above it — that's what carries the
              container query. Horizontal like the reference once there's room,
              stacked on a phone, where the select was squeezing the
              description into a five-line column. */}
          <FieldGroup>
            <Field orientation="responsive" className="gap-6">
              <FieldContent>
                <FieldTitle>Data retention</FieldTitle>
                <FieldDescription>
                  Auto-delete chats older than the selected window.
                </FieldDescription>
              </FieldContent>

              <Select
                // Without `items` the trigger renders the raw value — "12"
                // instead of "12 months". Base UI uses it to look the label up.
                items={RETENTION_OPTIONS}
                value={retentionToValue(current.chatRetentionMonths)}
                onValueChange={setRetention}
                disabled={saving === "chatRetention"}
              >
                <SelectTrigger className="w-40" aria-label="Data retention">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {RETENTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

export { AdminSecuritySettings }
