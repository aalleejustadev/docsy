# Docsy

Next.js 16 + Tailwind v4 + shadcn/ui, with Better Auth on Prisma 7 / Neon Postgres.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run db:migrate     # creates the auth tables
npm run dev
```

## Environment

`.env` is read by both Next.js and the Prisma CLI. A generated
`BETTER_AUTH_SECRET` is already in your local `.env`; the rest you supply.

### Database (required)

Create a project at [neon.tech](https://neon.tech) and copy both connection
strings from the dashboard:

- `DATABASE_URL` — the **pooled** string (host contains `-pooler`). Used by the
  app at runtime.
- `DIRECT_URL` — the same string without `-pooler`. Used by migrations, because
  pgBouncer can't run DDL inside a transaction.

Then run `npm run db:migrate` to create the tables.

### Email (optional, recommended)

Without `RESEND_API_KEY`, verification and password-reset links are printed to
the terminal instead of emailed — enough to test both flows locally. To send for
real, add a [Resend](https://resend.com) key and set `EMAIL_FROM` to an address
on a domain you've verified there.

### Social sign-in (optional)

Google and GitHub buttons appear in the auth dialogs only when both env vars for
that provider are set, so you can skip this entirely.

| Provider | Console | Redirect URI |
| --- | --- | --- |
| Google | [Cloud console](https://console.cloud.google.com/apis/credentials) | `http://localhost:3000/api/auth/callback/google` |
| GitHub | [Developer settings](https://github.com/settings/developers) | `http://localhost:3000/api/auth/callback/github` |

Swap `localhost:3000` for your domain in production, and set `BETTER_AUTH_URL` /
`NEXT_PUBLIC_APP_URL` to match.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run auth:generate` | Regenerate the auth models in `prisma/schema.prisma` |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:studio` | Browse the database |

Re-run `auth:generate` then `db:migrate` after changing auth options or plugins
in `lib/auth.ts`.

## Auth at a glance

- `lib/auth.ts` — server config: email/password, env-gated OAuth, rate limits,
  session and cookie policy.
- `lib/auth-client.ts` — React client. Client components import from here, never
  from `lib/auth.ts`.
- `components/auth/` — `SignInDialog` and `SignUpDialog`, plus the provider that
  lets any CTA raise them.

Sign-in and sign-up are modals. `AuthDialogProvider` sits in the marketing
layout, so the header, hero, pricing cards, and footer CTA all drive one shared
instance. `/reset-password` is a real page because an emailed link has to land
somewhere.

## Adding UI components

```bash
npx shadcn@latest add button
```
