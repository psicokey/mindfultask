import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import NextAuth, { AuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Asegúrate de que tu modelo User en prisma/schema.prisma tenga un campo 'name'
// y que 'user_id' sea el ID principal (normalmente Int o BigInt).

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials.password) {
          // Si no se proporcionan credenciales, no se autoriza
          return null;
        }

        // Busca el usuario en la base de datos usando Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Si el usuario no existe o no tiene una contraseña (ej. si usas otros proveedores)
        if (!user || !user.password) {
          throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
        }

        // Compara la contraseña proporcionada con la contraseña hasheada en la BD
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
        }

        // Si la autenticación es exitosa, devuelve un objeto User.
        // Asegúrate de que el id sea un string, ya que NextAuth lo espera así.
        return {
          id: user.id.toString(), // Asegúrate de que el ID sea un string
          name: user.name, // Asume que tu tabla 'User' tiene un campo 'name'
          email: user.email,
        } as User;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    // El callback 'jwt' se ejecuta cada vez que se crea un token JWT (ej. al iniciar sesión)
    async jwt({ token, user }) {
      if (user) {
        // 'user' es el objeto devuelto por el callback 'authorize'
        token.id = user.id;
        token.email = user.email;
        // Puedes añadir más propiedades al token si las necesitas en la sesión
        // token.name = user.name;
      }
      return token;
    },
    // El callback 'session' se ejecuta cada vez que se solicita una sesión
    async session({ session, token }) {
      if (token) {
        // 'token' es el objeto token JWT modificado por el callback 'jwt'
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        // Si añadiste 'name' al token, también lo puedes añadir aquí
        // session.user.name = token.name as string;
      }
      return session;
    },
    // El callback 'signIn' se ejecuta al intentar iniciar sesión
    async signIn({ user, account }) {
      // Solo permite el inicio de sesión si el proveedor es 'credentials'
      // y el usuario fue encontrado y validado.
      if (user && account?.provider === "credentials") {
        return true;
      }
      return false;
    },
  },
  pages: {
    signIn: "/login", // Ruta personalizada para la página de inicio de sesión
  },
  // La clave secreta principal para firmar tokens y cifrar datos.
  // Es crucial que sea una cadena larga y aleatoria.
  secret: process.env.NEXTAUTH_SECRET,
  // jwt: {
  //   secret: process.env.JWT_SECRET, // Esta opción está deprecada en NextAuth v4+
  // }
};

// Handler para API routes y App Router
const handler = NextAuth(authOptions);

// Exportación para API routes (ej. pages/api/auth/[...nextauth].ts)
export { handler as GET, handler as POST };

// Exportación para uso en Server Components (App Router)
// y otras utilidades que necesiten acceder a la sesión o funciones de auth
export const auth = () => {
  // En Next.js App Router, se recomienda usar `auth()` de `next-auth` directamente
  // Si estás en Pages Router, puedes usar `getSession`
  // Esta exportación es más para compatibilidad o si tienes un caso de uso específico.
  return NextAuth(authOptions).auth;
};
export const signIn = NextAuth(authOptions).signIn;
export const signOut = NextAuth(authOptions).signOut;
