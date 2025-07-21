import Image from "next/image";
import styles from "./index.module.css";


export default function Home() {
  return (
    <div className={styles.index}>
      <main className={styles.main}>
        <h1>WOW</h1>

        {/*GIF画像を表示（優先度指定しない） */}
        <img
          src="/ハッカソンsmpl.gif"
          alt="WOW GIF"
          width={400}
          height={300}
        />

        <p>これはWOWうさぎです。</p>
        <p>みちみちin</p>
        <a href="/create">新しい単語を追加</a>
      </main>
    </div>
  );
}