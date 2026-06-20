"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import type { UsageState } from "@/lib/usage";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/top-apps", label: "Top 100 Apps" },
  { href: "/dashboard/market-analysis", label: "Market Analysis" },
  { href: "/dashboard/viability", label: "Viability Scorer" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/store-listing", label: "Store Listing" },
  { href: "/dashboard/tech-stack", label: "Tech Stack" },
];

export function Sidebar({
  email,
  usage,
}: {
  email: string | null;
  usage: UsageState | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost px-3 py-1.5"
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } border-b border-border bg-surface p-4 md:block md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r`}
      >
        <div className="hidden md:block">
          <Logo />
        </div>

        <nav className="mt-6 space-y-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-surface-2 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-3">
          {usage ? (
            <>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Plan</span>
                <span className="font-medium uppercase text-primary">
                  {usage.plan}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {usage.limit === null
                  ? "Unlimited generations"
                  : `${usage.used} / ${usage.limit} generations this month`}
              </div>
              {usage.plan === "free" && (
                <Link
                  href="/dashboard/billing"
                  className="btn-primary mt-3 w-full py-1.5 text-xs"
                >
                  Upgrade to Pro
                </Link>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-400">
              Demo mode — add Supabase keys to track usage and save work.
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {email ? (
            <>
              <div className="truncate text-xs text-gray-500">{email}</div>
              <div className="mt-2 flex items-center gap-4">
                <Link
                  href="/dashboard/account"
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Account
                </Link>
                <form action="/auth/signout" method="post">
                  <button className="text-xs text-gray-400 hover:text-white">
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs text-primary hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
