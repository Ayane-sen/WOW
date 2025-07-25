import React from 'react';
import {useRouter} from 'next/router';

const ResultPage: React.FC=()=>{
    const router=useRouter();
    const{ correct, totalCount } = router.query;

    //数値に変換
    const correctCount=typeof correct === 'string' ? parseInt(correct, 10) : 0;
    const totalquestions=typeof totalCount === 'string' ? parseInt(totalCount, 10) : 0;

    //ホームページに戻る
    const handleBackToHome=()=>{
        router.push('/index'); // ホームページにリダイレクト
    };
    return (
        <div>
            <h1>クイズ結果</h1>
            <p>正解数: {correctCount} / {totalquestions}</p>
            <button onClick={handleBackToHome}>ホームに戻る</button>
        </div>
    );

};
export default ResultPage;