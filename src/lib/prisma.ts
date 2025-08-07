import { PrismaClient } from "@prisma/client";

// This is a best practice for using Prisma with Next.js.
// It prevents creating too many instances of PrismaClient in development
// due to Next.js's hot-reloading feature, which can exhaust database connections.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
