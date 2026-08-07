export type NavItem = {
  href: string
  label: string
}

export const siteConfig = {
  name: "Docsy",
  description:
    "Docsy turns scattered docs into a single searchable workspace your team can trust.",
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

/** Primary marketing navigation, shared by the header and the mobile drawer. */
export const mainNav: NavItem[] = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
]

/** Link columns in the site footer. */
export const footerNav: NavGroup[] = [
  {
    title: "Product",
    items: [
      { href: "/#product", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#security", label: "Security" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/api", label: "API" },
      { href: "/integrations", label: "Integrations" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/dpa", label: "DPA" },
      { href: "/soc-2", label: "SOC 2" },
    ],
  },
]
