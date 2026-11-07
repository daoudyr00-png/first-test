import { Compass, Gauge, KeyRound, LayoutDashboard, Lightbulb, Database, Swords, Target, type LucideIcon } from "lucide-react";
import type { CollectionName } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  collection?: CollectionName;
}

export const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Overview", items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Research",
    items: [
      { href: "/niches", label: "Niche Explorer", icon: Compass, collection: "niches" },
      { href: "/problems", label: "Problem Discovery", icon: Target, collection: "problems" },
      { href: "/competitors", label: "Competitor Research", icon: Swords, collection: "competitors" },
      { href: "/keywords", label: "Keyword Research", icon: KeyRound, collection: "keywords" },
    ],
  },
  {
    section: "Decide",
    items: [
      { href: "/scoring", label: "Opportunity Scoring", icon: Gauge, collection: "opportunities" },
      { href: "/ideas", label: "Product Ideas", icon: Lightbulb, collection: "ideas" },
    ],
  },
  { section: "Workspace", items: [{ href: "/data", label: "Data & Backup", icon: Database }] },
];
