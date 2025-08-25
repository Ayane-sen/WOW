import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Prismaをデータベースアダプターとして使用する設定
  adapter: PrismaAdapter(prisma),

  // 認証方法のリスト
  providers: [
    // メールアドレスとパスワードによる認証（Credentials Provider）
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // ログインフォームで受け取るフィールド
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      // 認証ロジック
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // データベースからユーザーを検索
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true, // パスワードハッシュを取得
            gachapoint: true, // ガチャポイントも取得
          },
        });

        if (!user) {
          console.log('ユーザーが見つかりませんでした。');
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        // ユーザーが存在し、かつパスワードが一致するか検証
        if (isPasswordCorrect) {
          console.log('認証成功！');
          return { id: user.id.toString(), name: user.username, email: user.email };
        } else {
          console.log('認証失敗：パスワードが一致しません。');
          return null;
        }
      },
    }),
  ],

  // セッションの管理方法
  session: {
    strategy: 'jwt', // JWT (JSON Web Token) を使用
  },

  // コールバック設定
  callbacks: {
    // JWTにユーザーIDを含める
    jwt: async ({ token, user }) => {
      if (user) {
        console.log("jwt callback user:", user);
        token.id = user.id;
        token.gachapoint = user.gachapoint; // ユーザーのガチャポイントをトークンに追加
      }
      return token;
    },
    // セッションオブジェクトにユーザーIDを含める
    session: ({ session, token }) => {
    // session.user と token.id の両方が存在する場合のみ、IDをセッションに追加する
    if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.gachapoint = token.gachapoint as number; // ガチャポイントもセッションに追加
    }
    return session;
    },
  },

  // ログインページのパス
  pages: {
    signIn: '/login', // '/login'ページをログイン画面として使用する場合
    // signOut: '/auth/signout',
    // error: '/auth/error', // エラーページもカスタムできる
    // verifyRequest: '/auth/verify-request', // メール認証の確認ページ
  },

  // セキュリティキー（本番環境では必ず設定）
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);