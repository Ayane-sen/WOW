import Image from "next/image";
import Head from "next/head";
import styles from "./index.module.css";


export default function Home() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WOW</title>
      </Head>

      <div className={styles.index}>
        <main className={styles.main}>
          <h1>WOW</h1>

          {/*GIF画像を表示（優先度指定しない） */}
          
          
        </main>
      </div>
    </>
  );
}