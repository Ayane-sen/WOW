import React,{useState,useEffect} from 'react';
import {useRouter} from 'next/router';
import Button from '../components/Button/Button';
import styles from '../styles/QuizPage.module.css';
import { useSession, signIn } from 'next-auth/react';

//クイズデータ型の定義
interface QuizData {
    question: string;// 問題文
    options: string[];// 選択肢の配列
    correctAnswer: string;// 正解の単語
    difficultyLevel: number;// 難易度レベル
}

const QuizPage: React.FC = () => {
    const router = useRouter(); // Next.jsのルーターを使用
    const { data: session, status } = useSession();
     const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);

    const [quiz, setQuiz] = useState<QuizData[] | null>(null); // 現在のクイズデータの状態
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0); // 現在のクイズのインデックス
    const [correctCount, setCorrectCount] = useState(0); // 正解の数
    const [correctDifficulties, setCorrectDifficulties] = useState<number[]>([]); // 正解の難易度レベルの配列
    const [quizFinished, setQuizFinished] = useState(false); // クイズが終了したかどうか
    const [selectedAnswer, setSelectedAnswer] = useState<string|null>(null); // ユーザーが選択した答え
    const [feedback, setFeedback] = useState<string|null>(null); // ユーザーへのフィードバックメッセージ
    const [isLoading, setIsLoading] = useState<boolean>(true); // ローディング状態の管理
    const [error, setError] = useState<string|null>(null); // エラーメッセージの状態
    const [debugMessage, setDebugMessage] = useState<string|null>(null); // デバッグメッセージの状態
    
    

    //コンポーネントがマウントされたときに一度だけクイズをフェッチ
    useEffect(() => {
        if (status === 'loading') {
            return; // セッション情報取得中は待機
        }
        if (status === 'unauthenticated') {
            router.push('/login'); // ログインしていなければログインページへ
        }
        if (status === 'authenticated' && session) {
            // クイズデータを取得する関数
            const fetchData = async() => {
                setIsLoading(true); // ローディング状態を開始
                setFeedback(null); // フィードバックをリセット
                setSelectedAnswer(null); // 選択した答えをリセット
                setError(null); // エラーをリセット
                setCurrentQuizIndex(0); // クイズのインデックスをリセット
                setQuizFinished(false); // クイズ終了状態をリセット
                setCorrectCount(0); // 正解数をリセット
                setDebugMessage(null); // デバッグメッセージをリセット
                setCorrectDifficulties([]); // 正解の難易度レベルをリセット

                try {
                    const userId = session.user.id;

                    // APIからクイズデータとステータス情報を取得
                    const [quizResponse, statusResponse] = await Promise.all([
                        fetch('/api/question', { credentials: 'include' }),
                        fetch(`/api/user/${userId}/gamestatus`, { credentials: 'include' })
                    ]); 
                    
                    // クイズデータの管理
                    if (!quizResponse.ok) {
                        const errorData = await quizResponse.json();
                        throw new Error(errorData.error || "クイズデータの取得に失敗しました。");
                    }
                    const data: QuizData[] = await quizResponse.json();
                    setQuiz(data); // 取得したクイズデータを状態に設定

                    // ステータスデータの処理
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        if (statusData?.status?.characterImage) {
                            setCharacterImageUrl(statusData.status.characterImage);
                        }
                    } else {
                        console.error("キャラクター情報の取得に失敗しました。");
                    }
                } catch(err: any) {
                    console.error("Error fetching quiz:", err);
                    setError(err.message || "クイズの読み込み中にエラーが発生しました。");
                    setDebugMessage(`Error fetching quiz: ${err.message}`); // デバッグメッセージを設定
                } finally {
                    setIsLoading(false); // ローディング状態を終了
                }
            };

            fetchData();
        }
    }, [status, session, router]);

    const handleAnswerSelect=(answer:string)=>{
        if(selectedAnswer)return; // 既に選択されている場合は何もしない
        setSelectedAnswer(answer);// ユーザーが選択した答えを設定
        const currentQuiz=quiz?.[currentQuizIndex];// 現在のクイズを取得
        if(currentQuiz && answer===currentQuiz.correctAnswer){
            setFeedback("正解です！");// 正解の場合のフィードバック
            setCorrectCount(prevCount=>{
                const newCount = prevCount + 1;
                if(currentQuiz.difficultyLevel!== undefined){
                    setCorrectDifficulties(prevDifficulties=>[...prevDifficulties, currentQuiz.difficultyLevel!]);// 正解の難易度レベルを追加
                }
                return newCount;
            });// 正解数を増やす
        }else{
            setFeedback("不正解です。正しい答えは「" + currentQuiz?.correctAnswer + "」です。");// 不正解の場合のフィードバック
        }
    };

    const handleNextQuiz=()=>{
        if(quiz && currentQuizIndex < quiz.length - 1){
            setCurrentQuizIndex(prevIndex=>prevIndex + 1);// 次のクイズに進む
            setSelectedAnswer(null);// 選択した答えをリセット
            setFeedback(null);// フィードバックをリセット
        }else{
            setDebugMessage(`最後の問題です。クイズ終了状態に設定します。正解数: ${correctCount}/${quiz?.length}`);// 結果をコンソールに表示
            //setQuizFinished(true);// 最後のクイズが終わったら終了状態を設定
            //ここで経験値を加算するAPIを呼ぶ
            router.push({
                pathname: '/result', // 結果ページにリダイレクト
                query: { correctCount: correctCount, total: quiz?.length || 0,correctDifficulties:JSON.stringify(correctDifficulties)}, // クエリパラメータで正解数と総問題数を渡す
            })
        }
    };
    const currentQuiz=quiz?.[currentQuizIndex]; // 現在のクイズデータを取得
    if(isLoading){
        return <div>Loading...</div>; // ローディング中の表示
    }

    if(error){
        return <div>Error: {error}</div>; // エラーが発生した場合の表示
    };
    if(!quiz){
        return <div>クイズが見つかりません。</div>; // クイズデータがない場合の表示
    };
    return (
        <div>
            <h1>クイズに挑戦</h1>
            <p><span>{currentQuiz?.question}</span></p>
            <ul>
                {currentQuiz?.options.map((option,index)=>(
                    <li key={index}>
                        <button
                            onClick={()=>handleAnswerSelect(option)}
                            disabled={!!selectedAnswer} // 既に選択されている場合はボタンを無効化
                            style={{
                                backgroundColor: selectedAnswer===option ? (option===currentQuiz.correctAnswer ? 'lightgreen' : 'lightcoral') : 'white',
                            }}
                        >
                            {option}
                        </button>
                    </li>
                ))}
            </ul>
            {feedback && <p>{feedback}</p>} {/* フィードバックメッセージの表示 */}
            {selectedAnswer && (
                <button onClick={handleNextQuiz}>次のクイズへ</button> // 次のクイズへ進むボタン
            )}
            {/* キャラクター画像を追加 */}
            {characterImageUrl && (
                <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                    <img src={characterImageUrl} alt="キャラクター" width="100" height="100" />
                </div>
            )}
        </div>
    )


}
export default QuizPage;