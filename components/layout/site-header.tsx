import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { SiteHeaderAuth } from "@/components/layout/site-header-auth";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur-2xl">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link className="transition-transform duration-300 hover:translate-y-[-1px]" href="/">
          <BrandLockup subtitle="Idea to site, beautifully fast" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <Link href="/#features" className="transition hover:text-slate-950">
            Features
          </Link>
          <Link href="/#foundation" className="transition hover:text-slate-950">
            Foundation
          </Link>
          <Link href="/sign-in" className="transition hover:text-slate-950">
            Sign in
          </Link>
        </nav>
        <SiteHeaderAuth />
      </Container>
    </header>
  );
}
