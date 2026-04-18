"use client";

import { UserButton } from "@clerk/nextjs";

import { hasClerkPublicEnv } from "@/lib/env";

export function AppUserMenu() {
  if (!hasClerkPublicEnv) {
    return (
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-soft">
        <img src="/logo.png" alt="LB" className="h-full w-full object-cover" />
      </div>

    );
  }

  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          userButtonAvatarBox:
            "h-11 w-11 rounded-[1.15rem] ring-1 ring-slate-200 shadow-soft",
        },
      }}
    />
  );
}
