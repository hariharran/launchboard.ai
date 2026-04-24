"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, FolderHeart, LayoutDashboard, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-project", label: "New Project", icon: Sparkles },
  { href: "/projects", label: "Saved Projects", icon: FolderHeart },
  { href: "/account", label: "Account", icon: CircleUserRound },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 p-1.5 shadow-premium backdrop-blur-2xl">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-95",
              isActive
                ? "bg-slate-950 text-white shadow-premium scale-[1.02]"
                : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-soft hover:scale-[1.02]",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
