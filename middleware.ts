import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { hasClerkServerEnv } from "@/lib/env";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/generator(.*)",
  "/new-project(.*)",
  "/projects(.*)",
  "/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!hasClerkServerEnv) {
    return;
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
