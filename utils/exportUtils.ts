
import * as XLSX from 'xlsx';
import { Student, TagDefinition, AiAnalysisResult } from '../types';

interface ExportOptions {
  classCount: number;
  students: Student[];
  tags: TagDefinition[];
  includeStats: boolean;
  aiAnalysis: AiAnalysisResult | string | null;
}

export const exportToExcel = ({
  classCount,
  students,
  tags,
  includeStats,
  aiAnalysis
}: ExportOptions) => {
  // 한국어 가나다 순 정렬 함수
  const koreanSort = (a: Student, b: Student) => {
    return a.name.localeCompare(b.name, 'ko');
  };

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // 1. 시트1: 반편성 결과
  const assignmentData: any[][] = [
    ['반', '이름', '성별', '특성 Tag']
  ];

  // Class Assignment List (가나다 순 정렬)
  for (let i = 1; i <= classCount; i++) {
    const classStudents = students
      .filter(s => s.assignedClassId === i.toString())
      .sort(koreanSort);
    if (classStudents.length === 0) {
      assignmentData.push([`${i}반`, '배정된 학생 없음', '', '']);
    } else {
      classStudents.forEach((s) => {
        const sTags = s.tagIds.map(tid => tags.find(t => t.id === tid)?.label).filter(Boolean).join(', ');
        const genderStr = s.gender === 'female' ? '여' : (s.gender === 'male' ? '남' : '-');
        assignmentData.push([`${i}반`, s.name, genderStr, sTags]);
      });
    }
  }

  // Unassigned (가나다 순 정렬)
  const unassigned = students
    .filter(s => !s.assignedClassId)
    .sort(koreanSort);
  if (unassigned.length > 0) {
    unassigned.forEach((s) => {
      const sTags = s.tagIds.map(tid => tags.find(t => t.id === tid)?.label).filter(Boolean).join(', ');
      const genderStr = s.gender === 'female' ? '여' : (s.gender === 'male' ? '남' : '-');
      assignmentData.push(['미배정', s.name, genderStr, sTags]);
    });
  }

  const assignmentSheet = XLSX.utils.aoa_to_sheet(assignmentData);

  // 열 너비 설정
  assignmentSheet['!cols'] = [
    { wch: 12 },  // 반
    { wch: 15 },  // 이름
    { wch: 8 },   // 성별
    { wch: 40 }   // 특성 Tag
  ];

  XLSX.utils.book_append_sheet(workbook, assignmentSheet, '반편성 결과');

  // 2. 시트2: 반별 통계 분석 (includeStats가 true일 때만)
  if (includeStats) {
    const statsData: any[][] = [];

    // Header
    const header = ['구분', ...Array.from({ length: classCount }, (_, i) => `${i + 1}반`)];
    statsData.push(header);

    // Total Count Row
    const totalRow = ['총 인원', ...Array.from({ length: classCount }, (_, i) => {
      const count = students.filter(s => s.assignedClassId === (i + 1).toString()).length;
      return `${count}명`;
    })];
    statsData.push(totalRow);

    // Gender Stats
    const maleRow = ['남학생', ...Array.from({ length: classCount }, (_, i) => {
      const count = students.filter(s => s.assignedClassId === (i + 1).toString() && s.gender === 'male').length;
      return `${count}명`;
    })];
    statsData.push(maleRow);

    const femaleRow = ['여학생', ...Array.from({ length: classCount }, (_, i) => {
      const count = students.filter(s => s.assignedClassId === (i + 1).toString() && s.gender === 'female').length;
      return `${count}명`;
    })];
    statsData.push(femaleRow);

    // Spacer
    statsData.push([]);

    // Each Tag Row
    tags.forEach(tag => {
      const tagRow = [tag.label, ...Array.from({ length: classCount }, (_, i) => {
        const count = students.filter(s => s.assignedClassId === (i + 1).toString() && s.tagIds.includes(tag.id)).length;
        return count > 0 ? count : '-';
      })];
      statsData.push(tagRow);
    });

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);

    // 통계 시트 열 너비 설정
    const statsCols = [
      { wch: 20 },  // 구분
      ...Array.from({ length: classCount }, () => ({ wch: 12 }))  // 각 반
    ];
    statsSheet['!cols'] = statsCols;

    XLSX.utils.book_append_sheet(workbook, statsSheet, '반별 통계 분석');

    // 3. 시트3: AI 분석 결과 (aiAnalysis가 있을 때만)
    if (aiAnalysis) {
      let analysisText = "";

      if (typeof aiAnalysis === 'string') {
        // 기존 텍스트 포맷 처리 (Bold 제거)
        analysisText = aiAnalysis.replace(/\*\*(.*?)\*\*/g, '$1');
      } else {
        // 구조화된 데이터 객체 처리 -> 텍스트로 변환
        analysisText += `[종합 점수]: ${aiAnalysis.overallScore}점\n`;
        analysisText += `[종합 평가]: ${aiAnalysis.overallComment}\n\n`;
        
        analysisText += `[상세 분석]\n`;
        aiAnalysis.classes.forEach(c => {
          analysisText += `${c.classId}반 (난이도: ${c.riskScore}, 균형: ${c.balanceScore}): ${c.comment}\n`;
        });
        
        analysisText += `\n[제안 사항]\n`;
        aiAnalysis.recommendations.forEach((rec, i) => {
          analysisText += `${i+1}. ${rec}\n`;
        });
      }

      const formattedAnalysis = analysisText.split('\n').map(line => [line]);
      const analysisSheet = XLSX.utils.aoa_to_sheet(formattedAnalysis);

      // 열 너비 조정 (가독성 향상)
      analysisSheet['!cols'] = [{ wch: 120 }];

      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'AI 분석 결과');
    }
  }

  // 파일 다운로드
  const fileName = `반편성결과_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
