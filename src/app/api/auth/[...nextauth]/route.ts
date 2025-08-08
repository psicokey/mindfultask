import NextAuth from "next-auth";
import { authOptions } from "app/lib/auth"; // Importar desde el nuevo archivo

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
