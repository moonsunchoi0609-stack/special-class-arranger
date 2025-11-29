import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Student, TagDefinition, SeparationRule, SchoolLevel, AiAnalysisResult } from '../types';
import { MAX_CAPACITY } from '../constants';

// 이름 마스킹 헬퍼 함수
export const maskName = (name: string): string => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '○';
  return name[0] + '○' + name.slice(2);
};

export const analyzeClasses = async (
  students: Student[],
  tags: TagDefinition[],
  rules: SeparationRule[],
  classCount: number,
  schoolLevel: SchoolLevel
): Promise<AiAnalysisResult | string> => {
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

  // Define Schema strictly matching user's requested structure
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallReview: {
        type: Type.STRING,
        description: "전체 반 편성 상태를 아우르는 핵심 종합 문장 1개."
      },
      classBriefs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "각 반별 현황을 1~2문장으로 요약한 리스트."
      },
      classDetails: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            classId: { type: Type.STRING },
            statusTitle: { type: Type.STRING, description: "형식: '핵심키워드'" },
            currentSituation: { type: Type.STRING },
            positiveFactors: { type: Type.STRING },
            advice: { type: Type.STRING },
            riskScore: { type: Type.NUMBER, description: "0~100 (높을수록 위험)" },
            balanceScore: { type: Type.NUMBER, description: "0~100 (높을수록 좋음)" }
          },
          required: ["classId", "statusTitle", "currentSituation", "positiveFactors", "advice", "riskScore", "balanceScore"]
        }
      },
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "제안 제목 (예: 1반과 2반 성비 조정 트레이드)" },
            movements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                    studentName: { type: Type.STRING, description: "이동할 학생 이름 (마스킹됨)" },
                    currentClass: { type: Type.STRING },
                    targetClass: { type: Type.STRING }
                },
                required: ["studentName", "currentClass", "targetClass"]
              },
              description: "이 제안을 위해 이동해야 하는 학생 명단. 맞교환인 경우 2명 이상의 이동을 포함."
            },
            reason: { type: Type.STRING, description: "이동해야 하는 이유" },
            expectedEffect: { type: Type.STRING, description: "이동 시 기대되는 구체적 효과" },
            predictedScore: { type: Type.NUMBER, description: "이 제안 하나를 적용했을 때의 예상 균형 점수 (0~100)" }
          },
          required: ["title", "movements", "reason", "expectedEffect", "predictedScore"]
        },
        description: "현재 상태에서 가장 효과적인 최적의 제안 1개만 포함 (여러 개 제안 금지)"
      },
      currentScore: { type: Type.NUMBER, description: "현재 상태의 종합 점수 (0~100)" },
      predictedScore: { type: Type.NUMBER, description: "AI 제안 적용 시 예상되는 최적 종합 점수 (0~100)" }
    },
    required: ["overallReview", "classBriefs", "classDetails", "suggestions", "currentScore", "predictedScore"]
  };

  let prompt = `
    당신은 20년 경력의 **특수교육 베테랑 교사**이자 반편성 컨설턴트입니다.
    제공된 학생 데이터, 태그, 규칙을 분석하여 **현실적이고 구체적인 해결책**을 JSON 포맷으로 리포트를 작성해주세요.

    **분석 목표:**
    1. **정원 준수 가이드:**
       - **기본 원칙:** 각 반의 학생 수는 **${limit}명**을 목표로 합니다.
       - **예외 허용:** 만약 **현재 이미 정원을 초과한 반**이 있다면, AI 제안 결과에서도 해당 인원 수 유지가 허용됩니다. (단, 현재 인원보다 더 늘리는 것은 금지합니다.)
       - **맞교환 활용:** 정원이 꽉 찼거나 초과된 반으로 학생을 보낼 때는, 반드시 다른 학생을 데려오는 **맞교환(Trade)**을 통해 인원 수가 늘어나지 않도록 하세요.
    2. **업무 강도 균형:** 교사의 신변처리 및 행동중재 강도가 한 반에 쏠리지 않도록 하세요.
       - **높은 부담 (High Load):** '공격성', '휠체어', '기저귀', '분쇄식'
       - **중간 부담 (Medium Load):** '화장실지원', '보행지원', '학부모예민'
       - **완화 요인:** '잦은결석', '교사보조가능' (업무 부담을 줄여주는 요소)
    3. **안전 확보 및 사고 방지**
       - '분리 배정' 규칙 절대 준수, 학생 간 충돌 예방
       - '공격성' 성향 학생의 분산 배치. 
    4. 성비 불균형 해소: 남녀 비율이 특정 성별에 쏠리지 않도록 조정. (단, 학생 특성이 더 중요함)

    **설정 정보:**
    - 학교 급: ${schoolLevel === 'ELEMENTARY_MIDDLE' ? '초/중학교 (정원 6명)' : '고등학교 (정원 7명)'}
    - 총 학급 수: ${classCount}개
    - 반 정원: ${limit}명 (기본 준수, 초과 반은 현상 유지 허용)
    
    **현재 데이터:**
    ${Object.entries(classesMap).map(([classId, classStudents]) => {
        const maleCount = classStudents.filter(s => s.gender === 'male').length;
        const femaleCount = classStudents.filter(s => s.gender === 'female').length;
        return `
      [${classId}반] (남:${maleCount}, 여:${femaleCount}, 총:${classStudents.length})
      명단: ${classStudents.map(s => {
        const tagsStr = s.tagIds.map(tid => tags.find(t => t.id === tid)?.label).filter(Boolean).join(', ');
        return `${maskName(s.name)}(${s.gender === 'female' ? '여' : '남'}, ${tagsStr})`;
      }).join(' / ')}
    `;
    }).join('\n')}

    **미배정:** ${unassigned.map(s => maskName(s.name)).join(', ') || '없음'}
    **분리규칙:** ${rules.map(r => r.studentIds.map(id => students.find(s => s.id === id)?.name).join(', ')).join(' / ') || '없음'}

    **작성 가이드:**
    1. **suggestions**: 
       - 전체 균형을 개선할 수 있는 **가장 효과적인 단 하나의 제안(1개)**만 작성하세요. 여러 선택지를 제공하지 마세요.
       - 이미 정원(${limit}명)이 찼거나 초과된 반으로 학생을 보낼 때는 반드시 **맞교환(Trade)** 방식을 제안하여, 해당 반의 인원이 현재보다 더 늘어나지 않도록 하세요.
       - 하나의 제안(item) 내에 관련된 모든 학생의 이동(movements)을 배열로 포함시키세요.
       - 각 제안별로 그 제안만 수행했을 때의 예상 점수(predictedScore)를 계산하여 포함하세요.
    2. **Scores**: 현재 점수와 개선 후 점수를 논리적으로 산정하세요.
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
            return response.text; 
        }
    }
    return "분석 결과를 생성할 수 없습니다.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message || String(error);
    if (errorMessage.includes("429")) return "⚠️ API 사용량 초과";
    return `⚠️ 분석 중 오류 발생: ${errorMessage}`;
  }
};