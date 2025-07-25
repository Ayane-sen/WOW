import React from 'react';
import {useRouter} from 'next/router';

const ResultPage: React.FC=()=>{
    const router=useRouter();
    const{ correctCount, total } = router.query;

    //数値に変換
    const correctcount=typeof correctCount === 'string' ? parseInt(correctCount, 10) : 0;
    const totalquestions=typeof total === 'string' ? parseInt(total, 10) : 0;

    //ホームページに戻る
    const handleBackToHome=()=>{
        router.push('/'); // ホームページにリダイレクト
    };
    return (
        <div>
            <h1>クイズ結果</h1>
            <p>正解数: {correctcount} / {totalquestions}</p>
            <button onClick={handleBackToHome}>ホームに戻る</button>
        </div>
    );

};
export default ResultPage;