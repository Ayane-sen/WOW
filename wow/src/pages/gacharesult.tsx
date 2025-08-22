
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";


// ガチャ結果の型を定義
interface GachaItem {
  id: string;
  name: string;
  rarity: string;
  description: string;
  type: string;
  image_url: string;
}

// ユーザー情報の型を拡張
interface ExtendedUser {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  gachapoint: number;
}

// セッションデータの型を拡張
interface ExtendedSession {
  user: ExtendedUser;
  expires: string;
}

const GachaPage: React.FC = () => {
  // ログイン状態を取得し、セッションデータの型を拡張
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string; };
  const router = useRouter();

  const [result, setResult] = useState<GachaItem | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [userGachapoint, setUserGachapoint] = useState<number | null>(null);
  const GACHA_COST = 100;
  console.log("status:", status);
console.log("session:", session);

  // 認証状態を監視し、ポイントをリアルタイムで表示
  useEffect(() => {
    if (status !== 'loading' && status !== 'authenticated') {
      router.push('/login');
    }
    if (status === 'authenticated' && session?.user && userGachapoint === null) {
      setUserGachapoint(Number(session.user.gachapoint));
    }
  }, [status, router,userGachapoint]);
  const handleGachaDraw = async () => {
    setLoading(true);
    setResult(null);
    setMessage("");

    try {
      const response = await fetch('/api/gacha/gacha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // ポイントが足りない場合（HTTPステータスコード 402）
      if (response.status === 402) {
        setMessage("ポイントが足りません！");
        return; // ここで処理を終了
      }
      
      // その他のエラー
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ガチャの実行に失敗しました');
      }

      // 成功した場合
      const data = await response.json();
      setResult(data.item);
      setMessage("おめでとうございます！🎉");

    } catch (error: any) {
      console.error("Error drawing gacha:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'authenticated') {
    return <p>読み込み中...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50">
      <div className="flex items-center justify-between w-full max-w-sm px-4">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-white font-bold rounded-full bg-gray-500 hover:bg-gray-600 transition-colors"
        >
          ホームに戻る
        </button>
        <div className="text-xl font-bold text-pink-700">
          所持ポイント: {session?.user?.gachapoint} ポイント
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-pink-700 mt-8 mb-4">
        ガチャを引こう！
      </h1>
      <p className="text-gray-600 mb-8">
        ガチャは {GACHA_COST} ポイントで引けます。
      </p>

      <button 
        onClick={handleGachaDraw}
        disabled={loading || (session?.user?.gachapoint !== undefined && session.user.gachapoint < GACHA_COST)}
        className="px-8 py-4 text-white font-bold text-lg rounded-full shadow-lg transition-transform transform hover:scale-105
                   bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-4 focus:ring-pink-300"
      >
        {loading ? '抽選中...' : 'ガチャを引く'}
      </button>

      {message && (
        <div className="mt-8 p-4 bg-white text-gray-800 rounded-lg shadow-md w-full max-w-sm text-center">
          <p>{message}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-pink-200 w-full max-w-sm text-center">
          <h2 className="text-2xl font-semibold mb-2 text-pink-700">
            {result.name}
          </h2>
          <p className="text-md text-gray-600 mb-4">{result.description}</p>
          <div className="mb-4">
            <img 
              src={result.image_url} 
              alt={result.name} 
              className="w-40 h-40 object-cover mx-auto rounded-lg shadow-md border-2 border-pink-300" 
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/160x160/FFC0CB/000000?text=No+Image';
              }}
            />
          </div>
          <p className="font-semibold text-gray-700">レアリティ: <span className="text-pink-600">{result.rarity}</span></p>
        </div>
      )}
    </div>
  );
};

export default GachaPage;