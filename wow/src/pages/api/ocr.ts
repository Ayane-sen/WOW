// pages/api/ocr.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { Translate } from '@google-cloud/translate/build/src/v2';

type LabelAnnotation = protos.google.cloud.vision.v1.ILabelAnnotation;

const client = new ImageAnnotatorClient();
const translateClient = new Translate();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const [result] = await client.labelDetection(imageBuffer);
    const labelAnnotations = result.labelAnnotations as LabelAnnotation[];

    if (!labelAnnotations || labelAnnotations.length === 0) {
      return res.status(200).json({ translatedLabels: [] });
    }

    // 信頼度が高いラベルの単語だけを取得
    const labelWords = new Set<string>(
      labelAnnotations
        .filter((label: LabelAnnotation) => label.score && label.score > 0.8)
        .map((label: LabelAnnotation) => label.description?.toLowerCase() || '')
    );

    // 抽出した単語を日本語に翻訳
    const translatedLabels = await Promise.all(
      Array.from(labelWords).map(async (word_en: string) => {
        try {
          const [word_ja] = await translateClient.translate(word_en, 'ja');
          return {
            word_en: word_en,
            word_ja: word_ja || '翻訳が見つかりませんでした。',
          };
        } catch (error) {
          console.error(`翻訳APIの呼び出しに失敗しました: ${word_en}`, error);
          return {
            word_en: word_en,
            word_ja: '翻訳中にエラーが発生しました。',
          };
        }
      })
    );

    const responsePayload = {
      translatedLabels: translatedLabels,
    };

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('ラベル検出処理中にエラーが発生しました:', error);
    return res.status(500).json({ error: '処理に失敗しました。' });
  }
}