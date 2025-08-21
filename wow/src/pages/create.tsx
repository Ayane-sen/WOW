import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

// CreateWordPage コンポーネントの定義
const CreateWordPage: React.FC = () => {
    // ログイン状態を取得
    const { data: session, status } = useSession();
    const router = useRouter();

    //// フォームの入力フィールド「単語」の値を管理するstate。初期値は空文字列。
    const [word, setWord] = useState("");
    // フォームの入力フィールド「意味」の値を管理するstate。初期値は空文字列。
    const [meaning, setMeaning] = useState("");
    //難易度の設定
    const [difficultyLevel, setDifficultyLevel] = useState(1); // 初期値は1
    //ユーザーに表示するメッセージ
    const [message, setMessage] = useState("");
    //データ送信中かどうかを示すブール値のstate
    const [loading, setLoading] = useState<boolean>(false);

    // 認証状態を監視
    useEffect(() => {
        // statusが 'loading' ではない、かつ 'authenticated' (ログイン済み) でもない場合
        if (status !== 'loading' && status !== 'authenticated') {
            // ログインページにリダイレクト
            router.push('/login');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();//ページの再読み込みの防止
        if(!word.trim() || !meaning.trim()) {
            setMessage("単語と意味は必須です。");
            return;
        }
        setLoading(true);//送信処理が始まる前にローディング状態をtrueに設定
        setMessage("");

        try {   
            const response = await fetch('/api/create',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',// リクエストボディの形式がJSONであることを指定
                },
                body: JSON.stringify({
                    word: word.trim(), // 単語の前後の空白を削除して送信
                    meaning: meaning.trim(), // 意味の前後の空白を削除して送信
                }),
            });

            if (response.ok) {
                setMessage("単語が正常に追加されました。");
                setWord(""); // フォームをクリア
                setMeaning(""); // フォームをクリア
            } else {
                const errorData = await response.json();
                setMessage(errorData.error || "単語の追加に失敗しました。");
            }
        } catch(error) {
            console.error("Error adding word:", error);
            setMessage("単語の追加に失敗しました。");
        } finally {
            setLoading(false); // ローディング状態をfalseに戻す
        }
    };

    if (status !== 'authenticated') {
        return <p>読み込み中...</p>;
    }

    return (
        <div>
            <h1>新しい単語の追加</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="word">単語:</label>
                    <input
                        type="text"
                        id="word"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="meaning">意味:</label>
                    <input
                        type="text"
                        id="meaning"
                        value={meaning}
                        onChange={(e) => setMeaning(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? "送信中..." : "単語を追加"}
                </button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
};

export default CreateWordPage;