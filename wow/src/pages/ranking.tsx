// pages/ranking.tsx

import { useState, useEffect } from 'react';
import Head from 'next/head';

// APIから返されるデータの型
interface RankingItem {
  userId: number;
  username: string;
  level: number;
  characterImage: string | null; // characterImageはnullになる可能性があるので?を付けます
}

const RankingPage = () => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // APIを呼び出す関数を定義
    const fetchRanking = async () => {
      try {
        // ここでランキングAPIエンドポイントを呼び出す
        const res = await fetch('/api/ranking'); 
        
        if (!res.ok) {
          throw new Error('APIからデータを取得できませんでした。');
        }
        
        const data: RankingItem[] = await res.json();
        setRanking(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []); // ページの初回表示時に一度だけ実行

  if (loading) {
    return <p>ランキングを読み込み中です...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>エラー: {error}</p>;
  }

  return (
    <div>
      <Head>
        <title>ユーザーランキング</title>
      </Head>
      <h1>ユーザーランキング</h1>
      {ranking.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ranking.map((item, index) => (
            <li key={item.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px' }}>{index + 1}位:</span>
              {/* characterImageがあれば表示、なければ代替のアイコンなどを表示 */}
              {item.characterImage ? (
                <img src={item.characterImage} alt={item.username + 'のキャラクター'} style={{ width: '50px', height: '50px', marginRight: '10px' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', marginRight: '10px', backgroundColor: '#ccc', borderRadius: '50%' }}></div>
              )}
              <span>
                {item.username} (レベル: {item.level})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>ランキングデータがありませんでした。</p>
      )}
    </div>
  );
};

export default RankingPage;