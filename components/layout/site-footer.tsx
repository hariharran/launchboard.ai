import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-slate-200/70 py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <Container className="flex flex-col gap-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <BrandLockup subtitle="Idea to site, beautifully fast" compact />
          <p className="max-w-md text-sm leading-7 text-slate-500">
            A polished AI website builder for fast-moving founders, agencies, and small teams.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900">
            Privacy
          </Link>
          <Link href="#" className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900">
            Terms
          </Link>
          <Link href="#" className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900">
            Contact
          </Link>
        </div>
      </Container>
    </footer>
  );
}
