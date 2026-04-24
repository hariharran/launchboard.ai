import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";
import { TextSelectionGuard } from "@/components/app/text-selection-guard";
import { clerkAppearance } from "@/lib/clerk-theme";
import { hasClerkPublicEnv } from "@/lib/env";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: "Launchboard AI",
  description: "Generate launch-ready marketing sites, discover domains, and improve SEO in one polished workspace.",
  metadataBase: new URL(appUrl),
  applicationName: "Launchboard AI",
  keywords: ["AI website generator", "startup landing page", "domain search", "SEO score"],
  openGraph: {
    title: "Launchboard AI",
    description:
      "Generate launch-ready marketing sites, discover domains, and improve SEO in one polished workspace.",
    url: appUrl,
    siteName: "Launchboard AI",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TextSelectionGuard />
        {hasClerkPublicEnv ? (
          <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
