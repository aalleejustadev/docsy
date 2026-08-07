<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project structure

```text
app/
  layout.tsx            root layout: fonts, metadata, ThemeProvider
  globals.css           Tailwind v4 theme + design tokens
  (marketing)/          public landing routes
    layout.tsx          SiteHeader + <main> shell
    page.tsx            "/" — composes landing sections
components/
  ui/                   shadcn primitives — owned by the shadcn CLI, don't hand-edit
  layout/               page chrome: site-header, mobile-nav, site-footer
  marketing/            landing sections: hero, how-it-works, pricing, faqs, …
  auth/                 sign-in / sign-up dialogs
  search/               search trigger + command palette
  theme/                theme-provider, mode-toggle
  brand/                logo mark and wordmark
  common/               small cross-cutting pieces (e.g. typing-dots)
hooks/                  shared React hooks
lib/
  site-config.ts        site metadata + navigation data
  utils.ts              cn()
ui-design/              reference screenshots (light/ and dark/) — the source of truth for UI work
```

Rules of thumb:

- One landing section per file in `components/marketing/`, named after its reference screenshot (`ui-design/landing/light/2-hero.png` → `hero.tsx`). Sections are composed in `app/(marketing)/page.tsx`, not nested in each other.
- Shared content (nav items, site name/description) lives in `lib/site-config.ts` so server and client components can both import it without pulling in a component module.
- New routes get their own route group when they need different chrome (e.g. `app/(app)/` for the signed-in product).
