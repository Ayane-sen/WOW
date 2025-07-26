import type { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react";

// import '../styles/globals.css'; 

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    // SessionProviderでアプリ全体を囲む
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;