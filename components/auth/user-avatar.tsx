import type { SessionUser } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/** Up to two letters from the name, falling back to the email's local part. */
function userInitials(user: Pick<SessionUser, "name" | "email">) {
  const source = user.name?.trim() || user.email

  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

/** The session user's photo, or their initials on the brand disc. */
function UserAvatar({
  user,
  className,
  ...props
}: React.ComponentProps<typeof Avatar> & {
  user: Pick<SessionUser, "name" | "email" | "image">
}) {
  return (
    <Avatar className={cn("shrink-0", className)} {...props}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="bg-brand font-medium text-brand-foreground">
        {userInitials(user)}
      </AvatarFallback>
    </Avatar>
  )
}

export { UserAvatar, userInitials }
