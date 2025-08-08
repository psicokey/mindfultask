// src/lib/auth.ts
import { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "app/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function getUser(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error("Error al buscar el usuario:", error);
    return null;
  }
}
export async function hashPassword(password: string): Promise<string | null> {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    return hashedPassword;
  } catch (error) {
    console.error("Error al hashear la contraseña:", error);
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
      async authorize(credentials): Promise<User | null> {
        if (credentials?.guest) {
          console.log("Attempting guest login...");
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
        return {
          id: user.id.toString(), // Asegúrate de que el ID sea un string
          name: user.name,
          email: user.email,
          image: user.image, // Asegúrate de incluir la imagen si la tienes
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
  },
  pages: {
    signIn: "/auth/login", // Ruta personalizada para la página de inicio de sesión
    error: "/auth/error", // Página para mostrar errores de autenticación
  },
  secret: process.env.NEXTAUTH_SECRET,
};
