"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Menu, X } from "lucide-react";
import { NAV } from "./nav";
import { useDatabase } from "@/hooks/useDatabase";
import { clearError } from "@/lib/store";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine font-display text-[15px] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
        P
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] text-ink">Opportunity Finder</span>
        <span className="block text-[11px] tracking-wide text-faint">Digital product research</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { db, ready } = useDatabase();
  return (
    <nav className="flex flex-col gap-6">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[10.5px] font-semibold tracking-[0.12em] text-faint uppercase">{group.section}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              const count = item.collection && ready ? db[item.collection].length : null;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13.5px] transition-colors ${
                      active ? "bg-paper font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-soft hover:bg-ivory-deep hover:text-ink"
                    }`}
                  >
                    {active && <span className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-wine" />}
                    <Icon size={16} className={active ? "text-wine" : "text-faint group-hover:text-muted"} />
                    <span className="flex-1">{item.label}</span>
                    {count !== null && count > 0 && <span className="num text-[11px] text-faint">{count}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { error } = useDatabase();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-ivory lg:flex">
        <div className="px-5 pt-5 pb-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavLinks />
        </div>
        <div className="border-t border-line px-5 py-4 text-[11.5px] leading-relaxed text-faint">
          Data is stored in this browser. Export a backup from <Link href="/data" className="text-muted underline-offset-2 hover:underline">Data &amp; Backup</Link>.
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ivory/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className="rounded-md p-2 text-ink-soft hover:bg-ivory-deep">
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ivory shadow-pop">
            <div className="flex items-center justify-between px-5 pt-4 pb-5">
              <Brand />
              <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="rounded-md p-2 text-ink-soft hover:bg-ivory-deep">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        {error && (
          <div className="flex items-start gap-3 border-b border-[#f1cccc] bg-[#fbeaea] px-4 py-2.5 text-[13px] text-[#8f1d1d] sm:px-8">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error} Your browser storage may be full or disabled.</span>
            <button type="button" onClick={clearError} className="font-medium underline">Dismiss</button>
          </div>
        )}
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-8 sm:py-9">{children}</div>
      </main>
    </div>
  );
}
