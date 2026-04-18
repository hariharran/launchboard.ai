import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AppNav } from "@/components/layout/app-nav";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { AppUserMenu } from "@/components/layout/app-user-menu";
import { Container } from "@/components/ui/container";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))]">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur-2xl">
        <Container className="flex h-20 items-center justify-between gap-6">
          <Link
            href="/dashboard"
            className="transition-transform duration-300 hover:translate-y-[-1px]"
          >
            <BrandLockup subtitle="Protected workspace" />
          </Link>

          <div className="hidden md:block">
            <AppNav />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-soft sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              Session active
            </div>
            <AppUserMenu />
          </div>
        </Container>
        <Container className="pb-4 md:hidden">
          <div className="overflow-x-auto">
            <AppNav />
          </div>
        </Container>
      </header>

      <main>{children}</main>
    </div>
  );
}
