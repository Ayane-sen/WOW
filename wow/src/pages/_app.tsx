// src/pages/_app.tsx
import "../styles/global.css"; // ← ここでグローバルCSSを読み込む！
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
