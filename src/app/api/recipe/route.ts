import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요.' 
      }, { status: 500, headers: corsHeaders });
    }

    const ai = new GoogleGenAI({ apiKey });

    const { 
      imagesBase64, 
      extraText, 
      defaultSeasonings, 
      servings = '1인분', 
      filters = [], 
      pantryIngredients = [] 
    } = await req.json();

    const prompt = `
당신은 '냉파셰프(냉장고 파먹기 전문 셰프)'입니다.
사용자가 가진 재료(사진들, 보관중인 재료, 추가 텍스트)와 기본 조미료를 바탕으로 3가지 요리 레시피를 추천해주세요.
반드시 마크다운 백틱 없이 순수한 JSON 규격으로만 응답해야 합니다. 다른 말은 절대 추가하지 마세요.

[사용자 맞춤 조건]
- 목표 인원수: ${servings} (모든 재료와 양념 분량은 반드시 ${servings} 기준으로 정확히 맞추세요)
- 적용할 상황/도구 필터: ${filters.length > 0 ? filters.join(', ') : '기본 (제한 없음)'}
- 현재 냉장고에 보관 중인 재료: ${pantryIngredients.length > 0 ? pantryIngredients.join(', ') : '없음'}
- 사용 가능한 기본 조미료: ${defaultSeasonings.join(', ')}
- 추가 입력 재료: ${extraText || '없음'}

중요 규칙:
1. 계량은 ml나 g 대신 누구나 알기 쉬운 **'밥숟가락 1스푼', '종이컵 반 컵', '작은 1술', '한 꼬집'** 등 친숙한 한국식 표준 계량으로 통일하세요.
2. 필터 조건(예: '아이용(안 맵게)', '전자레인지 전용', '다이어트' 등)이 있다면 조리법과 양념에 반드시 100% 반영하세요.
3. 이커머스(마켓컬리/쿠팡) 제휴를 위한 '플러스 원(+1) 업그레이드 팁(upgradeTip)'을 각 레시피마다 1개씩 작성하세요. (집에 없는 고급/포인트 재료 1개를 구매해서 넣으면 요리 퀄리티가 대폭 상승하는 팁)
4. 만약 사진들이나 텍스트에서 식재료를 전혀 찾을 수 없다면, 반드시 아래 규격의 JSON만 반환하세요:
{
  "error": "재료를 찾을 수 없어요. 냉장고 안을 좀 더 밝게 다시 찍어주거나 텍스트로 적어주세요!"
}

그렇지 않고 식재료가 확인되면, 다음 출력 JSON 스키마 규격을 무조건 따르세요:
{
  "detectedIngredients": ["인식된재료1", "인식된재료2"],
  "recipes": [
    {
      "category": "초간단" | "메인요리" | "이색안주",
      "title": "요리명",
      "time": "15분",
      "servings": "${servings}",
      "difficulty": "쉬움" | "보통" | "어려움",
      "estimatedCalories": 450,
      "description": "한 줄 요약",
      "usedIngredients": ["재료1", "재료2"],
      "remainingIngredients": ["남은재료1", "남은재료2"],
      "seasoningRatio": [
        {"name": "진간장", "spoon": "2스푼"}
      ],
      "substituteTips": "대체 팁 안내 문구",
      "steps": ["1단계 조리법", "2단계 조리법"],
      "estimatedSavings": 22000,
      "upgradeTip": {
        "ingredient": "트러플 오일",
        "description": "완성 후 트러플 오일 2~3방울을 둘러주면 파인다이닝 레스토랑 풍미로 변신!",
        "searchKeyword": "트러플 오일"
      }
    }
  ]
}

- recipes 배열은 반드시 '초간단', '메인요리', '이색안주' 카테고리를 각각 1개씩 포함하여 총 3개여야 합니다.
- estimatedCalories는 정수 칼로리(kcal)입니다.
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

    contents.push(prompt);

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean) as string[];

    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: 'application/json',
          }
        });
        if (res.text) {
          responseText = res.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying next...`, err.message || err);
        lastError = err;
      }
    }

    if (responseText) {
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed, { headers: corsHeaders });
    } else {
      console.error('All Gemini models failed:', lastError);
      return NextResponse.json({ 
        error: '냉파셰프 연결 오류: ' + (lastError?.message || '잠시 후 다시 시도해주세요!') 
      }, { status: 500, headers: corsHeaders });
    }

  } catch (error: any) {
    console.error('Gemini API Handler Error:', error);
    return NextResponse.json({ 
      error: '냉파셰프 처리 오류: ' + (error?.message || '잠시 후 다시 시도해주세요!') 
    }, { status: 500, headers: corsHeaders });
  }
}
