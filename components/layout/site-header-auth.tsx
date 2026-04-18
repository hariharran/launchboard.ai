"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button";
import { hasClerkPublicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export function SiteHeaderAuth() {
  if (!hasClerkPublicEnv) {
    return (
      <Link className={cn(buttonVariants())} href="/sign-up">
        Start free
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <Link className={cn(buttonVariants())} href="/sign-up">
          Start free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-3">
          <Link className={cn(buttonVariants({ variant: "secondary" }))} href="/dashboard">
            Dashboard
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "h-11 w-11 rounded-[1.15rem] ring-1 ring-slate-200 shadow-soft",
              },
            }}
          />
        </div>
      </SignedIn>
    </div>
  );
}
