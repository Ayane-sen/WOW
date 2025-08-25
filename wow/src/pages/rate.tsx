import { useState, useEffect } from 'react';

// 表示するデータの型を定義
type AccuracyRate = {
  word: string;
  accuracyRate: string;
};

const MyAccuracyRatePage = () => {
  const [data, setData] = useState<AccuracyRate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccuracyData = async () => {
      try {
        const response = await fetch('/api/accuracy_rate');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchAccuracyData();
  }, []); // ページ読み込み時に一度だけ実行

  if (loading) {
    return <p>ロード中だよ...</p>;
  }

  if (error) {
    return <p>エラーが発生しました: {error}</p>;
  }

  if (!data || data.length === 0) {
    return <p>まだクイズの履歴がありません。</p>;
  }

  return (
    <div>
      <h1>正答率</h1>
      <table>
        <thead>
          <tr>
            <th>単語</th>
            <th>正答率</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.word}>
              <td>{item.word}</td>
              <td>{item.accuracyRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyAccuracyRatePage;