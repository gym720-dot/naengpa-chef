import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { imagesBase64, extraText, defaultSeasonings } = await req.json();

    const prompt = `
당신은 '냉파셰프(냉장고 파먹기 셰프)'입니다.
사용자가 가진 재료(사진들 및 추가 텍스트)와 기본 조미료를 바탕으로 3가지 요리 레시피를 추천해주세요.
반드시 마크다운 백틱 없이 순수한 JSON 규격으로만 응답해야 합니다. 다른 말은 절대 추가하지 마세요.

- 사용 가능한 기본 조미료: ${defaultSeasonings.join(', ')}
- 추가 입력 재료: ${extraText || '없음'}

중요: 만약 사진들이나 텍스트에서 식재료를 전혀 찾을 수 없다면, 반드시 아래 규격의 JSON만 반환하세요:
{
  "error": "재료를 찾을 수 없어요. 냉장고 안을 좀 더 밝게 다시 찍어주거나 텍스트로 적어주세요!"
}

그렇지 않고 식재료가 확인되면, 다음 출력 JSON 스키마 규격을 무조건 따르세요:
{
  "detectedIngredients": ["재료1", "재료2"],
  "recipes": [
    {
      "category": "초간단" | "메인요리" | "이색안주",
      "title": "요리명",
      "time": "15분",
      "difficulty": "쉬움" | "보통" | "어려움",
      "description": "한 줄 요약",
      "usedIngredients": ["재료1", "재료2"],
      "seasoningRatio": [
        {"name": "조미료명", "spoon": "2스푼"}
      ],
      "substituteTips": "대체 팁 안내 문구",
      "steps": ["1단계 조리법", "2단계 조리법"],
      "estimatedSavings": 22000
    }
  ]
}

- recipes 배열은 반드시 '초간단', '메인요리', '이색안주' 카테고리를 각각 1개씩 포함하여 총 3개여야 합니다.
- estimatedSavings는 배달 시켰을 때 대비 절약한 금액을 대략적으로 추정한 정수입니다.
`;

    const contents: any[] = [];
    if (imagesBase64 && Array.isArray(imagesBase64)) {
      imagesBase64.forEach((img: string) => {
        const base64Data = img.split(',')[1] || img;
        const mimeType = img.split(';')[0].split(':')[1] || 'image/jpeg';
        
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        });
      });
    }

    contents.push({ text: prompt });

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed, { headers: corsHeaders });
    } else {
      return NextResponse.json({ error: 'No content from model' }, { status: 500, headers: corsHeaders });
    }

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
