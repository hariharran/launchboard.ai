export const hasClerkPublicEnv = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const hasClerkServerEnv =
  hasClerkPublicEnv && Boolean(process.env.CLERK_SECRET_KEY);

export const hasDatabaseEnv = Boolean(process.env.DATABASE_URL);

export const hasAuthPersistenceEnv = hasClerkServerEnv && hasDatabaseEnv;
