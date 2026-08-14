import { createHash } from "node:crypto"
import { Resend } from "resend"

import {
  changeEmailVerificationEmail,
  passwordResetEmail,
  verificationEmail,
  type EmailContent,
} from "@/lib/email/templates"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Docsy <onboarding@resend.dev>"
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO

// Constructed once, and only when a key exists — the SDK throws on an empty one.
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

let sandboxWarningLogged = false

/**
 * `onboarding@resend.dev` is Resend's sandbox sender: it only delivers to the
 * email address on your own Resend account, and silently reaches nobody else.
 * Anything real has to come from a domain you've verified.
 */
function warnIfSandboxSender() {
  if (sandboxWarningLogged || !EMAIL_FROM.includes("@resend.dev")) return
  sandboxWarningLogged = true
  console.warn(
    `[email] EMAIL_FROM is "${EMAIL_FROM}", Resend's sandbox sender — it can only ` +
      `deliver to your own Resend account address. Set EMAIL_FROM to an address on ` +
      `a domain you've verified at https://resend.com/domains to reach real users.`
  )
}

/**
 * Idempotency key for a send. Derived from the payload rather than a timestamp
 * so a genuine retry of the *same* mail de-duplicates, while a newly issued
 * token is a different key and sends normally. Keying on something stable per
 * user instead (e.g. `password-reset/<user-id>`) would 409 the second reset
 * request within the key's 24h lifetime.
 */
function idempotencyKeyFor(kind: string, url: string) {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 32)
  return `${kind}/${digest}`
}

type SendArgs = {
  to: string
  content: EmailContent
  idempotencyKey: string
}

/**
 * Sends through Resend, or logs the link to the terminal when RESEND_API_KEY
 * isn't set. The fallback keeps sign-up and password reset testable locally
 * before you've verified a sending domain.
 *
 * Throws on a Resend API error so Better Auth surfaces the failure rather than
 * silently reporting success to the user.
 */
async function send({ to, content, idempotencyKey }: SendArgs) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY is not set — logging instead of sending.\n` +
        `  to:      ${to}\n` +
        `  subject: ${content.subject}\n` +
        `  ${content.text.split("\n").join("\n  ")}`
    )
    return
  }

  warnIfSandboxSender()

  // The Node SDK resolves with `{ data, error }` rather than throwing, so the
  // error has to be checked explicitly.
  const { data, error } = await resend.emails.send(
    {
      from: EMAIL_FROM,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(EMAIL_REPLY_TO ? { replyTo: EMAIL_REPLY_TO } : {}),
    },
    { idempotencyKey }
  )

  if (error) {
    throw new Error(
      `Resend failed to send "${content.subject}": ${error.message}`
    )
  }

  return data?.id
}

export function sendVerificationEmail(to: string, url: string) {
  return send({
    to,
    content: verificationEmail(url),
    idempotencyKey: idempotencyKeyFor("email-verification", url),
  })
}

/** `to` is the new address; `previousEmail` is the one it replaces. */
export function sendChangeEmailVerification(
  to: string,
  previousEmail: string,
  url: string
) {
  return send({
    to,
    content: changeEmailVerificationEmail(previousEmail, url),
    idempotencyKey: idempotencyKeyFor("change-email", url),
  })
}

export function sendPasswordResetEmail(to: string, url: string) {
  return send({
    to,
    content: passwordResetEmail(url),
    idempotencyKey: idempotencyKeyFor("password-reset", url),
  })
}
