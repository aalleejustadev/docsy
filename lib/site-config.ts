export type NavItem = {
  href: string
  label: string
}

export const siteConfig = {
  name: "Docsy",
  description:
    "Docsy turns scattered docs into a single searchable workspace your team can trust.",
}

/** Primary marketing navigation, shared by the header and the mobile drawer. */
export const mainNav: NavItem[] = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
]
