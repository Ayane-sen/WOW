// src/pages/_app.tsx
import "../styles/global.css"; // ← ここでグローバルCSSを読み込む！
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react"


function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    // SessionProviderでアプリ全体を囲む
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
