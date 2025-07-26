import { DefaultSession, DefaultJWT } from "next-auth";

    // NextAuth.jsのデフォルトの型定義を拡張
    declare module "next-auth" {
      /**
       * `Session` オブジェクトの `user` プロパティの型を拡張します。
       * これにより、`session.user.id` にアクセスできるようになります。
       */
      interface Session {
        user?: {
          id: string; // **追加: ユーザーIDの型をstringとして定義**
        } & DefaultSession["user"]; // DefaultSessionのuserプロパティを継承
      }

      /**
       * `JWT` (JSON Web Token) の型を拡張します。
       * これにより、`token.id` にアクセスできるようになります。
       */
      interface JWT extends DefaultJWT {
        id?: string; // **追加: JWTトークンにユーザーIDの型を定義**
      }
    }
    