// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// Esto asegura que solo haya una instancia de PrismaClient en desarrollo
// para evitar múltiples conexiones a la base de datos debido al hot-reloading de Next.js.
const prisma = global.prisma || new PrismaClient({
  log: ['query'], // Opcional: para ver las consultas SQL en la consola
});

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;
