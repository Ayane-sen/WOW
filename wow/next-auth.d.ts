import { DefaultSession, DefaultJWT } from "next-auth";

    // NextAuth.jsのデフォルトの型定義を拡張
    declare module "next-auth" {

      interface User extends DefaultUser {
        gachapoint: number; // Userオブジェクトに gachapoint を追加
        id: string; // AdapterUserから継承されるが、明示的に含めてもOK
      }
      interface Session {
        user?: {
          gachapoint: number;
          id: string; // **追加: ユーザーIDの型をstringとして定義**
        } & DefaultSession["user"]; // DefaultSessionのuserプロパティを継承
      }

      /**
       * `JWT` (JSON Web Token) の型を拡張します。
       * これにより、`token.id` にアクセスできるようになります。
       */
      interface JWT extends DefaultJWT {
        gachapoint: number;
        id?: string; // **追加: JWTトークンにユーザーIDの型を定義**
      }
    }
    