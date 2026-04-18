import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUserOrRedirect } from "@/lib/auth";
import { hasClerkServerEnv } from "@/lib/env";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasClerkServerEnv) {
    return <AppShell>{children}</AppShell>;
  }

  await requireAuthenticatedUserOrRedirect();

  return <AppShell>{children}</AppShell>;
}
