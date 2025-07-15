import 'next-auth'
import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extiende el objeto `Session` para incluir el `id` del usuario.
   */
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}