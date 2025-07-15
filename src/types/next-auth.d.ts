import { DefaultSession, User as DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

// Extiende el tipo User por defecto para añadir el campo 'role'
interface User extends DefaultUser {
  role?: string;
}

// Extiende el tipo Session para que el objeto 'user' dentro de la sesión
// incluya los campos personalizados 'id' y 'role'.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

// Extiende el tipo JWT para incluir los tokens personalizados
// que se añaden en el callback 'jwt'.
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
  }
}