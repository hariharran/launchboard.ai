import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 py-12">
      <Container className="flex flex-col gap-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <BrandLockup subtitle="Idea to site, beautifully fast" compact />
          <p className="max-w-md text-sm leading-7 text-slate-500">
            A polished AI website builder for fast-moving founders, agencies, and small teams.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <Link href="#" className="transition hover:text-slate-900">
            Privacy
          </Link>
          <Link href="#" className="transition hover:text-slate-900">
            Terms
          </Link>
          <Link href="#" className="transition hover:text-slate-900">
            Contact
          </Link>
        </div>
      </Container>
    </footer>
  );
}
