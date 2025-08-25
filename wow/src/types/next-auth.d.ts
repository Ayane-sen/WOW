import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * `useSession`, `getSession`から返されるセッションの型
   */
  interface Session {
    user: {
      /** ユーザーID */
      id: string;
      /** ガチャポイント */
      gachapoint: number;
    } & DefaultSession["user"]; // 元々の name, email, image も使えるようにする
  }
}

declare module "next-auth/jwt" {
  /** JWTコールバックで返されるトークンの型 */
  interface JWT {
    /** ユーザーID */
    id?: string;
    /** ガチャポイント */
    gachapoint: number;
  }
}