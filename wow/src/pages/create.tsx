import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import clsx from 'clsx';
import styles from '../styles/createStyles.module.css';

// CreateWordPage コンポーネントの定義
const CreateWordPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [word, setWord] = useState("");
    const [meaning, setMeaning] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState(1);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (status !== 'loading' && status !== 'authenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!word.trim() || !meaning.trim()) {
            setMessage("単語と意味は必須です。");
            return;
        }
        setLoading(true);
        setMessage("");

        try {   
            const response = await fetch('/api/create',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    word: word.trim(),
                    meaning: meaning.trim(),
                }),
            });

            if (response.ok) {
                setMessage("単語が正常に追加されました。");
                setWord("");
                setMeaning("");
            } else {
                const errorData = await response.json();
                setMessage(errorData.error || "単語の追加に失敗しました。");
            }
        } catch(error) {
            console.error("Error adding word:", error);
            setMessage("単語の追加に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    if (status !== 'authenticated') {
        return (
            <div className={styles.container}>
                <p className={clsx(styles.loadingMessage, 'animate-pulse')}>読み込み中...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <h1 className={styles.title}>新しい単語の追加</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="word" className={styles.label}>単語:</label>
                        <input
                            type="text"
                            id="word"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="meaning" className={styles.label}>意味:</label>
                        <input
                            type="text"
                            id="meaning"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? "送信中..." : "単語を追加"}
                    </button>
                    {message && (
                        <p className={clsx(styles.message, {
                            [styles.successMessage]: message.includes("正常に"),
                            [styles.errorMessage]: !message.includes("正常に"),
                        })}>
                            {message}
                        </p>
                    )}
                </form>
                <button
                    onClick={() => router.push('/')}
                    className={clsx(styles.button, styles.backButton)}
                >
                    メニューに戻る 🏠
                </button>
            </div>
        </div>
    );
};

export default CreateWordPage;