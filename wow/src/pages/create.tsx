import {useState} from "react";
// CreateWordPage コンポーネントの定義
const CreateWordPage: React.FC = () => {
    //// フォームの入力フィールド「単語」の値を管理するstate。初期値は空文字列。
    const [word, setWord] = useState("");
    // フォームの入力フィールド「意味」の値を管理するstate。初期値は空文字列。
    const [meaning, setMeaning] = useState("");
    //ユーザーに表示するメッセージ
    const [message, setMessage] = useState("");
    //データ送信中かどうかを示すブール値のstate
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();//ページの再読み込みの防止
        if(!word.trim() || !meaning.trim()) {
            setMessage("単語と意味は必須です。");
            return;
        }
        setLoading(true);//送信処理が始まる前にローディング状態をtrueに設定
        try {   
            const response = await fetch('/api/wordcreate',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',// リクエストボディの形式がJSONであることを指定
                },
                body: JSON.stringify({
                    word: word.trim(), // 単語の前後の空白を削除して送信
                    meaning: meaning.trim(), // 意味の前後の空白を削除して送信
                }),
            });

            let data;
            if(response.ok){
                data= await response.json();
                setMessage("単語が正常に追加されました。");
                setWord(""); // フォームをクリア
                setMeaning(""); // フォームをクリア
            }else{
                const errorText = await response.text();
                try {
                    const json = JSON.parse(errorText);
                    setMessage(json.error || "単語の追加に失敗しました。");
                } catch {
                    setMessage("サーバーエラーが発生しました。");
                }
            }
        }catch(error){
            console.error("Error adding word:", error);
            setMessage("単語の追加に失敗しました。");
        }finally{
            setLoading(false); // ローディング状態をfalseに戻す
        }
    };
    return (
        <div>
            <h1>新しい単語に追加</h1>
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