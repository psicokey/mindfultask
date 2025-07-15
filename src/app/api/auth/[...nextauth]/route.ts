"server-only";

import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "app/lib/prisma";
import bcrypt from "bcryptjs";
import { User as PrismaUser } from "@prisma/client";

// La función authenticateUser ahora devuelve un tipo User de Prisma (o el que uses)
// Asegúrate de que tu modelo 'user' en la base de datos incluya id, name, email, password y role.
async function getUser(email: string): Promise<PrismaUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Error al buscar el usuario:", error);
    return null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // El tipo 'User' aquí proviene de next-auth
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUser(credentials.email);

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }
        
        // Retorna el objeto usuario que cumple con el tipo 'User' de next-auth
        // Incluye los campos personalizados que extendimos.
        return {
          id: user.user_id.toString(),
          name: user.name,
          email: user.email,
           // Asumiendo que tu usuario de BD tiene un campo 'role'
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 horas
  },
  callbacks: {
    // Los tipos 'token' y 'user' ahora son correctos gracias a la declaración de tipos
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token;
    },
    // Los tipos 'session' y 'token' también son correctos
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error", // Página para mostrar errores de autenticación
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };