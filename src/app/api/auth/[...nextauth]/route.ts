// auth.ts
// "server-only"; // Puedes mantener esto si quieres que este archivo sea estrictamente server-side

import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google"; // Importa el proveedor de Google
import * as prisma from "app/lib/prisma"; // Asegúrate de que la ruta sea correcta, se cambió a @/lib/prisma
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { User as PrismaUser } from "@prisma/client"; // Importa el tipo User de Prisma

// La función authenticateUser ahora devuelve un tipo User de Prisma (o el que uses)
// Asegúrate de que tu modelo 'user' en la base de datos incluya id, name, email, password y role.
async function getUser(email: string): Promise<PrismaUser | null> {
  try {
    const user = await prisma.prisma.user.findUnique({
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
        guest: { label: "Guest Login", type: "boolean", optional: true },
      },

      // El tipo 'User' aquí proviene de next-auth
      async authorize(credentials): Promise<User | null> {
        if (credentials?.guest) {
          console.log("Attempting guest login...");
          // Genera un ID único para el invitado
          const guestId = `guest-${uuidv4()}`;
          return {
            id: guestId,
            name: "Invitado",
            email: `${guestId}@example.com`, // Email ficticio
            image: null,
          };
        }
        if (!credentials?.email || !credentials.password) {
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
          id: user.id.toString(), // Asegúrate de que el ID sea un string
          name: user.name,
          email: user.email,
          image: user.image, // Asegúrate de incluir la imagen si la tienes
        };
      },
    }),
    // --- Implementación del Google Provider ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Opcional: Puedes configurar scopes adicionales si los necesitas
      // scope: ['profile', 'email'],
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 horas
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 'user' estará presente en el primer inicio de sesión o después de un refresh
      if (user) {
        token.id = user.id;
        // Si usas Google, el 'user' de NextAuth ya tendrá 'name', 'email', 'image'
        // Puedes copiar esas propiedades al token si las necesitas en la sesión
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    // Opcional: Puedes añadir un callback signIn si necesitas lógica específica
    // por ejemplo, para guardar usuarios de Google en tu base de datos si no usas un adaptador.
    // Si usas un adaptador de Prisma (como en la configuración estándar de NextAuth con Prisma),
    // NextAuth se encarga de crear/actualizar el usuario automáticamente.
    // async signIn({ user, account, profile }) {
    //   if (account?.provider === 'google') {
    //     // Lógica personalizada para Google si es necesaria, por ejemplo,
    //     // para vincular cuentas o manejar usuarios existentes.
    //     // Si usas un adaptador de base de datos con NextAuth, esto no es estrictamente necesario.
    //     return true;
    //   }
    //   return true; // Permite el inicio de sesión para otros proveedores
    // }
  },
  pages: {
    signIn: "/auth/login", // Ruta personalizada para la página de inicio de sesión
    error: "/auth/error", // Página para mostrar errores de autenticación
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Exportaciones para uso en Server Components (App Router)
// y otras utilidades que necesiten acceder a la sesión o funciones de auth
export const auth = NextAuth(authOptions).auth;
export const signIn = NextAuth(authOptions).signIn;
export const signOut = NextAuth(authOptions).signOut;
