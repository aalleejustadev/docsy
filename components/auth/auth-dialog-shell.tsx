"use client"

import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { DocsyMark } from "@/components/brand/docsy-logo"

/**
 * The chrome both auth dialogs share: centered mark, title, description, and
 * the muted cross-link bar pinned to the bottom edge.
 *
 * Padding is applied inside rather than on `DialogContent` so the footer bar
 * can bleed to the rounded corners without negative margins.
 */
function AuthDialogShell({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  footer: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-100"
      >
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 text-muted-foreground"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="flex flex-col gap-6 px-8 pt-8 pb-7">
          <div className="flex flex-col items-center gap-4 text-center">
            <DocsyMark className="size-11" />
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="font-heading text-xl leading-tight font-bold">
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>

          {children}
        </div>

        <div className="border-t bg-muted/50 px-8 py-4 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** "Already have an account? Sign in" — the tinted action in the footer bar. */
function AuthSwitchButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-brand underline-offset-4 hover:underline"
    >
      {children}
    </button>
  )
}

export { AuthDialogShell, AuthSwitchButton }
