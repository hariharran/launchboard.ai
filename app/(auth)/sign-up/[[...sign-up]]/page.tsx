import { ClerkFailed, ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { clerkComponentAppearance } from "@/lib/clerk-theme";
import { hasClerkPublicEnv } from "@/lib/env";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Start free"
      title="Create your Launchboard account."
      description="Set up your workspace, generate polished sites, and save every iteration in one place."
    >
      {hasClerkPublicEnv ? (
        <>
          <ClerkLoading>
            <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
              Loading secure sign-up...
            </div>
          </ClerkLoading>
          <ClerkFailed>
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm leading-7 text-rose-950">
              Clerk could not load on this page. Check your Clerk keys, allowed origins, and any
              browser extension blocking third-party auth scripts, then refresh.
            </div>
          </ClerkFailed>
          <ClerkLoaded>
            <SignUp
              appearance={clerkComponentAppearance}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/dashboard"
            />
          </ClerkLoaded>
        </>
      ) : (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
          Add your Clerk publishable and secret keys to your local environment to enable the sign-up flow.
        </div>
      )}
    </AuthShell>
  );
}
