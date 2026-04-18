import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";

import { hasAuthPersistenceEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type SyncedAuthUser = {
  clerkUserId: string;
  dbUser: User;
};

const AUTH_SYNC_MAX_RETRIES = 3;

function isRetryablePrismaWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.message.includes("Server selection timeout");
  }

  if (error instanceof Error) {
    return (
      error.message.includes("Server selection timeout") ||
      error.message.includes("No available servers") ||
      error.message.includes("ReplicaSetNoPrimary") ||
      error.message.includes("received fatal alert")
    );
  }

  return false;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function upsertUserWithRetry(params: {
  clerkId: string;
  email: string;
  name: string | null;
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < AUTH_SYNC_MAX_RETRIES; attempt += 1) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          clerkId: params.clerkId,
        },
      });

      if (existingUser) {
        return await prisma.user.update({
          where: {
            clerkId: params.clerkId,
          },
          data: {
            email: params.email,
            name: params.name,
          },
        });
      }

      return await prisma.user.create({
        data: {
          clerkId: params.clerkId,
          email: params.email,
          name: params.name,
        },
      });
    } catch (error) {
      if (!isRetryablePrismaWriteConflict(error) || attempt === AUTH_SYNC_MAX_RETRIES - 1) {
        throw error;
      }

      lastError = error;
      await wait(120 * (attempt + 1));
    }
  }

  throw lastError;
}

function getPrimaryEmailAddress(
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!clerkUser) {
    return null;
  }

  const primaryEmailId = clerkUser.primaryEmailAddressId;
  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === primaryEmailId,
  );

  return primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
}

export async function syncClerkUserToDb(): Promise<SyncedAuthUser | null> {
  if (!hasAuthPersistenceEnv) {
    return null;
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = getPrimaryEmailAddress(clerkUser);

  if (!email) {
    throw new Error("Authenticated Clerk user is missing a primary email address.");
  }

  const resolvedName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    null;

  const dbUser = await upsertUserWithRetry({
    clerkId: userId,
    email,
    name: resolvedName,
  }).catch((error) => {
    if (isDatabaseUnavailableError(error)) {
      throw new DatabaseUnavailableError(
        "Database is temporarily unavailable. Check the MongoDB connection string, Atlas network access, and current cluster health.",
      );
    }

    throw error;
  });

  return {
    clerkUserId: userId,
    dbUser,
  };
}

export async function getCurrentDbUser(): Promise<User | null> {
  const syncedUser = await syncClerkUserToDb();

  return syncedUser?.dbUser ?? null;
}

export class AuthRequiredError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "Database is temporarily unavailable.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export async function requireCurrentDbUser(): Promise<User> {
  if (!hasAuthPersistenceEnv) {
    throw new Error("Clerk or database environment variables are not configured.");
  }

  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    throw new AuthRequiredError();
  }

  const dbUser = await getCurrentDbUser();

  if (!dbUser) {
    throw new Error("Unable to resolve the authenticated user in the database.");
  }

  return dbUser;
}

export async function requireCurrentDbUserOrRedirect(): Promise<User> {
  if (!hasAuthPersistenceEnv) {
    throw new Error("Clerk or database environment variables are not configured.");
  }

  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return requireCurrentDbUser();
}

export async function requireAuthenticatedUserOrRedirect() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }
}
