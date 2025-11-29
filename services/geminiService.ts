
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Student, TagDefinition, SeparationRule, SchoolLevel, AiAnalysisResult } from '../types';
import { MAX_CAPACITY } from '../constants';

// 이름 마스킹 헬퍼 함수
const maskName = (name: string): string => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '○';
  // 3글자 이상: 가운데 글자(인덱스 1)를 ○로 변경 (예: 홍길동 -> 홍○동, 남궁민수 -> 남○민수)
  return name[0] + '○' + name.slice(2);
};

export const analyzeClasses = async (
  students: Student[],
  tags: TagDefinition[],
  rules: SeparationRule[],
  classCount: number,
  schoolLevel: SchoolLevel
): Promise<AiAnalysisResult | string> => {
  // Decode the API key at runtime using the browser's atob function
  const apiKey = typeof __API_KEY_B64__ !== 'undefined' && __API_KEY_B64__ ? atob(__API_KEY_B64__) : '';

  if (!apiKey) {
    return "🚫 **API 키 미설정**\n\n시스템 설정에서 API 키를 확인할 수 없습니다. 관리자에게 문의하거나 네트워크 상태를 확인해주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data context
  const classesMap: Record<string, Student[]> = {};
  for (let i = 1; i <= classCount; i++) {
    classesMap[i.toString()] = students.filter(s => s.assignedClassId === i.toString());
  }
  const unassigned = students.filter(s => !s.assignedClassId);
  const limit = MAX_CAPACITY[schoolLevel];

  // Define Schema for structured output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: {
        type: Type.NUMBER,
        description: "전체적인 반 편성 균형 점수 (0~100점). 높을수록 좋음."
      },
      overallComment: {
        type: Type.STRING,
        description: "전체적인 편성 상태에 대한 종합적인 평가 및 총평 (3~4문장)."
      },
      classes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            classId: { type: Type.STRING, description: "반 번호 (예: '1')" },
            riskScore: { 
              type: Type.NUMBER, 
              description: "해당 반의 지도 난이도/위험도 점수 (0~100점). 높을수록 교사의 부담이 크고 위험함." 
            },
            balanceScore: { 
              type: Type.NUMBER, 
              description: "해당 반의 구성원 조화 및 균형 점수 (0~100점). 높을수록 좋음." 
            },
            comment: { type: Type.STRING, description: "해당 반에 대한 상세 분석 코멘트." }
          },
          required: ["classId", "riskScore", "balanceScore", "comment"]
        }
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "개선이 필요한 구체적인 제안 사항들 (미배정 학생 배치 제안 포함)."
      }
    },
    required: ["overallScore", "overallComment", "classes", "recommendations"]
  };

  let prompt = `
    당신은 특수학교 반편성 전문가입니다.
    현재 반 편성 상황을 분석하고 JSON 형식으로 구조화된 리포트를 제공해주세요.

    **설정 정보:**
    - 학교 급: ${schoolLevel === 'ELEMENTARY_MIDDLE' ? '초/중학교 (정원 6명)' : '고등학교 (정원 7명)'}
    - 총 학급 수: ${classCount}개
    - 반 정원 제한: ${limit}명

    **특성 Tag 해석 가이드 (중요):**
    1. **부담 경감 요소**: '잦은결석', '교사보조가능' -> 지도 부담을 **줄여주는** 요인.
    2. **부담 가중 요소**: '공격성', '화장실지원', '보행지원', '휠체어', '학부모예민', '분쇄식' 등 -> 지도 부담을 **높이는** 요인.
    3. **분석 기준**: 
       - 부담 가중 요소가 특정 반에 쏠리지 않았는지 (Risk Score 반영)
       - 성별 및 성향이 고르게 분포되었는지 (Balance Score 반영)
       - 미배정 학생이 있다면 적절한 배치 제안

    **현재 편성 현황:**
    ${Object.entries(classesMap).map(([classId, classStudents]) => {
        const maleCount = classStudents.filter(s => s.gender === 'male').length;
        const femaleCount = classStudents.filter(s => s.gender === 'female').length;
        return `
      [${classId}반] (총 ${classStudents.length}명 - 남:${maleCount} / 여:${femaleCount})
      학생들: ${classStudents.map(s => {
        const tagsStr = s.tagIds.map(tid => tags.find(t => t.id === tid)?.label).filter(Boolean).join(', ');
        const genderStr = s.gender === 'female' ? '여' : (s.gender === 'male' ? '남' : '');
        let info = [];
        if(genderStr) info.push(genderStr);
        if(tagsStr) info.push(tagsStr);
        return `${maskName(s.name)}(${info.join(', ')})`;
      }).join(' / ')}
    `;
    }).join('\n')}

    **미배정 학생:**
    ${unassigned.map(s => {
        const genderStr = s.gender === 'female' ? '여' : (s.gender === 'male' ? '남' : '');
        return `${maskName(s.name)}${genderStr ? `(${genderStr})` : ''}`;
    }).join(', ') || '없음'}

    **분리 배정 규칙(서로 같은 반이 되면 안됨):**
    ${rules.map((r, idx) => {
        const names = r.studentIds.map(sid => students.find(s => s.id === sid)?.name).filter(n => n).map(n => maskName(n!)).join(', ');
        return `${idx + 1}. ${names}`;
    }).join('\n') || '없음'}

    **필수 요청 사항:**
    1. Risk Score: 0~100점. 공격성이나 지원 요구가 많은 학생이 몰릴수록 높게 책정.
    2. Balance Score: 0~100점. 성비, 학생 수, 성향이 골고루 섞일수록 높게 책정.
    3. recommendations: 구체적인 학생 이동 제안이나 주의사항.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });
    
    if (response.text) {
        try {
            return JSON.parse(response.text) as AiAnalysisResult;
        } catch (e) {
            console.error("JSON Parsing Error", e);
            return response.text; // Fallback to raw text if parsing fails
        }
    }
    return "분석 결과를 생성할 수 없습니다.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message || String(error);

    if (errorMessage.includes("API_KEY_HTTP_REFERRER_BLOCKED") || 
        errorMessage.includes("Requests from referer") ||
        (errorMessage.includes("403") && errorMessage.includes("blocked"))) {
      return `🚫 **API 키 설정 오류**\n\n현재 도메인(Referer)이 API 키 허용 목록에 포함되지 않았습니다.\nGoogle Cloud Console 또는 AI Studio에서 API 키 설정을 확인하고, 현재 도메인 주소를 추가해주세요.`;
    }

    if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return `⚠️ **API 사용량 초과**\n\n잠시 후 다시 시도해 주세요. (Quota Exceeded)`;
    }

    return `⚠️ **AI 분석 중 오류 발생**\n\n오류 내용: ${errorMessage}\n\n잠시 후 다시 시도하거나, 문제가 지속되면 관리자에게 문의하세요.`;
  }
};
