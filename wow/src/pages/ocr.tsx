// pages/ocr.tsx

import { useRef, useState, useEffect } from 'react';
import Head from 'next/head';

// APIから返されるデータの型を修正
interface TranslatedLabel {
  word_en: string;
  word_ja: string;
}

const OcrPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  // detectedWordsからtranslatedLabelsにステート名を変更
  const [translatedLabels, setTranslatedLabels] = useState<TranslatedLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('カメラの起動に失敗しました:', err);
        setError('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
      });
  };

  useEffect(() => {
    startCamera();
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    const photo = photoRef.current;
    if (!video || !photo) return;

    photo.width = video.videoWidth;
    photo.height = video.videoHeight;

    const context = photo.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, photo.width, photo.height);
      setHasPhoto(true);
      setTranslatedLabels([]);
    }
  };

  const sendToOcrApi = async () => {
    const photo = photoRef.current;
    if (!photo) {
      console.error('写真がキャプチャされていません。');
      setError('写真がキャプチャされていません。');
      return;
    }

    setLoading(true);
    setError(null);
    setTranslatedLabels([]);
    
    const imageBase64 = photo.toDataURL('image/jpeg');

    try {
      console.log('APIリクエストを送信します...');
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('APIからの応答が失敗しました:', res.status, errorData);
        throw new Error(`APIからの応答に失敗しました。ステータス: ${res.status}`);
      }

      const data = await res.json();
      console.log('APIから正常なレスポンスを受信しました:', data);
      
      setTranslatedLabels(data.translatedLabels || []);

      if (data.translatedLabels.length === 0) {
        setError('写真からラベルが検出されませんでした。');
      }

    } catch (err: any) {
      console.error('API呼び出し中にエラーが発生しました:', err);
      setError('処理に失敗しました。詳細はコンソールを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>もちもち翻訳</title>
      </Head>
      <h1>もちもちに聞いてみよう</h1>

      <div style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: hasPhoto ? 'none' : 'block' }}></video>
        <canvas ref={photoRef} style={{ width: '100%', display: hasPhoto ? 'block' : 'none' }}></canvas>
      </div>

      <div style={{ marginTop: '10px' }}>
        {!hasPhoto && (
          <button onClick={takePhoto} style={{ marginRight: '10px' }}>写真を撮る</button>
        )}
        {hasPhoto && (
          <>
            <button onClick={sendToOcrApi} disabled={loading}>
              {loading ? '処理中...' : '聞いてみる'}
            </button>
            <button onClick={() => setHasPhoto(false)} style={{ marginLeft: '10px' }}>撮り直す</button>
          </>
        )}
      </div>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>エラー: {error}</p>}

      {translatedLabels.length > 0 && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          {loading && <p>読み込み中...</p>}
          <p>これは</p>
          <ul>
            {translatedLabels.slice(0, 1).map((item, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                <strong>{item.word_en}</strong>: {item.word_ja}
              </li>
            ))}
          </ul>
          <p>だもっち</p>
        </div>
      )}
    </div>
  );
};

export default OcrPage;