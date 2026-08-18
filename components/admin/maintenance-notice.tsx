import { WrenchIcon } from "lucide-react"

import { siteConfig } from "@/lib/site-config"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * What everyone but an admin sees while maintenance mode is on.
 *
 * Deliberately a dead end rather than a redirect: bouncing someone to the
 * landing page would invite them to sign in again and again without ever saying
 * why nothing works.
 */
function MaintenanceNotice() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty className="max-w-120">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WrenchIcon />
          </EmptyMedia>
          <EmptyTitle>{siteConfig.name} is down for maintenance</EmptyTitle>
          <EmptyDescription>
            We&apos;re making some changes and will be back shortly. Your
            documents and chats are untouched — nothing is being deleted.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <p className="text-sm text-muted-foreground">
            Already signed in? You&apos;ll pick up exactly where you left off.
          </p>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export { MaintenanceNotice }
