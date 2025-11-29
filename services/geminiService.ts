import { GoogleGenAI } from "@google/genai";
import { Student, TagDefinition, SeparationRule, SchoolLevel } from '../types';
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
): Promise<string> => {
  // Vite 환경 변수 사용
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    return "API Key가 설정되지 않았습니다. Netlify 설정에서 VITE_API_KEY를 추가해주세요.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data context
  const classesMap: Record<string, Student[]> = {};
  for (let i = 1; i <= classCount; i++) {
    classesMap[i.toString()] = students.filter(s => s.assignedClassId === i.toString());
  }
  const unassigned = students.filter(s => !s.assignedClassId);
  const limit = MAX_CAPACITY[schoolLevel];

  let prompt = `
    당신은 특수학교 교사들을 돕는 반편성 전문가입니다.
    현재 반 편성 상황을 분석하고 조언을 해주세요.

    **설정 정보:**
    - 학교 급: ${schoolLevel === 'ELEMENTARY_MIDDLE' ? '초/중학교 (정원 6명)' : '고등학교 (정원 7명)'}
    - 총 학급 수: ${classCount}개
    - 반 정원 제한: ${limit}명

    **특성 Tag 해석 가이드 (중요):**
    1. **부담 경감 요소**: '잦은결석', '교사보조가능' Tag를 가진 학생은 교사의 실질적인 지도 부담을 **줄여주는** 요인으로 간주하세요. 
       - '잦은결석': 출석률이 낮아 실질적으로 관리하는 학생 수가 줄어드는 효과가 있습니다.
       - '교사보조가능': 교사의 지시를 잘 따르거나 또래 도움을 줄 수 있어 학급 운영에 도움이 됩니다.
       - 따라서, 이 Tag를 가진 학생들은 행동 중재가 많이 필요한 학생(공격성 등)이 있는 반에 배치하여 균형을 맞추는 것이 좋습니다.
    2. **부담 가중 요소**: 그 외의 Tag(예: '공격성', '화장실지원', '보행지원', '휠체어', '학부모예민', '분쇄식' 등)는 교사의 물리적, 심리적 지원이 많이 필요한 요소입니다. 한 반에 과도하게 몰리지 않도록 해야 합니다.

    **현재 편성 현황:**
    ${Object.entries(classesMap).map(([classId, classStudents]) => `
      [${classId}반] (총 ${classStudents.length}명)
      학생들: ${classStudents.map(s => {
        const studentTags = s.tagIds.map(tid => tags.find(t => t.id === tid)?.label).filter(Boolean).join(', ');
        return `${maskName(s.name)}(${studentTags})`;
      }).join(' / ')}
    `).join('\n')}

    **미배정 학생:**
    ${unassigned.map(s => maskName(s.name)).join(', ') || '없음'}

    **분리 배정 규칙(서로 같은 반이 되면 안됨):**
    ${rules.map((r, idx) => {
        const names = r.studentIds.map(sid => students.find(s => s.id === sid)?.name).filter(n => n).map(n => maskName(n!)).join(', ');
        return `${idx + 1}. ${names}`;
    }).join('\n') || '없음'}

    **서식 및 톤앤매너 가이드:**
    - **가독성**: 분석 결과 출력 시 **마크다운 볼드체(**)**를 과도하게 사용하지 마세요. 
      - 학생 수, 핵심적인 균형 문제, 중요한 제안 사항 등 **정말 강조가 필요한 키워드**에만 **굵은 글씨**를 사용하세요.
      - 문장 전체나 모든 항목 제목을 볼드 처리하는 것은 피해주세요.
    - **특수기호**: 별표(*) 기호는 목록형 스타일(bullet point) 외에는 텍스트 강조용으로 사용하지 마세요. 
    - 어조: 정중하고 부드러운 한국어 경어체를 사용하세요.

    **요청 사항:**
    1. 각 반의 **'실질적인 지도 난이도'**의 균형이 맞는지 확인하세요. (학생 수는 무조건 정원에 맞춰지므로 **학생 수 균형은 고려하지 마세요**. 오직 '부담 경감/가중 요소'를 바탕으로 한 업무 강도 균형만 판단하세요.)
    2. 특정 반에 부담 가중 요소(예: 공격성, 휠체어 등)가 과도하게 몰려 교사의 부담이 크지 않은지 확인하세요.
    3. 분리 배정 규칙 위반 여부를 다시 한 번 체크하세요.
    4. 미배정 학생이 있다면 어디로 배치하는 것이 좋을지 제안하세요.
    5. **종합 분석 및 제안**: 다음 형식에 맞춰 작성해 주세요.
       - **전체적인 개선 제안**: 현재 편성의 문제점과 해결 방안을 3~4문장으로 요약
       - **제안된 편성안 상세 분석**:
         - **개선 효과**: 제안대로 변경 시 예상되는 긍정적 효과 (예: 교사 부담 완화, 학생 간 갈등 예방 등)
         - **잔여 과제**: 여전히 해결되지 않거나 주의가 필요한 부분 (예: 특정 반의 과밀, 지원 인력 필요성 등)
    6. 답변 시 학생 이름은 마스킹된 상태 그대로(예: 홍○동) 언급해 주세요.
    7. **필수**: 답변의 맨 마지막 줄에 반드시 "※ 본 분석 결과는 참고용이며, 최종 결정은 학교의 상황을 고려하여 진행해 주시기 바랍니다."라는 문구를 포함하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "분석 결과를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};