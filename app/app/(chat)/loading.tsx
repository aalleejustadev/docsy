import { Spinner } from "@/components/ui/spinner"

/** Sits inside the chat chrome, so the history sidebar stays while a chat loads. */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
