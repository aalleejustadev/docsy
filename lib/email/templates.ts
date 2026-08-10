import { siteConfig } from "@/lib/site-config"

export type EmailContent = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * One plain, table-free layout for every transactional email. Inline styles
 * only — Gmail and Outlook strip <style> blocks.
 *
 * Sizes follow the transactional-email guidance: 16px body copy and a tap
 * target at least 44px tall, since most of these are opened on a phone.
 */
function layout({
  preheader,
  heading,
  body,
  action,
  url,
  footnote,
}: {
  /** Snippet shown after the subject in the inbox list. Keep under 90 chars. */
  preheader: string
  heading: string
  body: string
  action: string
  url: string
  footnote: string
}) {
  const href = escapeHtml(url)

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f6f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#171717;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:32px;">
      <p style="margin:0 0 24px;font-size:16px;font-weight:700;">${escapeHtml(siteConfig.name)}</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#57534e;">${escapeHtml(body)}</p>
      <a href="${href}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;line-height:20px;padding:14px 24px;border-radius:8px;">${escapeHtml(action)}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#78716c;">${escapeHtml(footnote)}</p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#a8a29e;">
        If the button doesn't work, paste this into your browser:<br />
        <span style="word-break:break-all;">${escapeHtml(url)}</span>
      </p>
    </div>
  </body>
</html>`
}

export function verificationEmail(url: string): EmailContent {
  const heading = "Confirm your email address"
  const body = `Tap the button below to finish setting up your ${siteConfig.name} account.`
  const footnote =
    "This link expires in 1 hour. If you didn't sign up, you can ignore this email."

  return {
    subject: `Confirm your email for ${siteConfig.name}`,
    html: layout({
      preheader: "This link expires in 1 hour.",
      heading,
      body,
      action: "Confirm email",
      url,
      footnote,
    }),
    text: `${heading}\n\n${body}\n\n${url}\n\n${footnote}`,
  }
}

export function passwordResetEmail(url: string): EmailContent {
  const heading = "Reset your password"
  const body = `We received a request to reset the password on your ${siteConfig.name} account.`
  const footnote =
    "This link expires in 1 hour and can only be used once. If you didn't request a reset, your password is unchanged and no action is needed."

  return {
    subject: `Reset your ${siteConfig.name} password`,
    html: layout({
      preheader: "This link expires in 1 hour and can only be used once.",
      heading,
      body,
      action: "Reset password",
      url,
      footnote,
    }),
    text: `${heading}\n\n${body}\n\n${url}\n\n${footnote}`,
  }
}
