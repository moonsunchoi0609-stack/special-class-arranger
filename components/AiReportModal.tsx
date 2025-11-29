import React, { useState, useMemo } from 'react';
import { 
  X, Wand2, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, 
  User, Star, Activity, ThumbsUp, ArrowLeftRight, LayoutDashboard, ChevronDown, ChevronUp, RefreshCcw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { AiAnalysisResult, Student, TagDefinition, AiMovement } from '../types';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AiAnalysisResult | string | null;
  students?: Student[];
  tags?: TagDefinition[];
  classCount?: number;
  onReanalyze?: () => void;
  isLoading?: boolean;
}

// Local helper to match mask logic from service
const maskName = (name: string): string => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '○';
  return name[0] + '○' + name.slice(2);
};

// --- SIMULATION VIEW COMPONENT ---
const SimulationView: React.FC<{
  students: Student[];
  movements: AiMovement[];
  classCount: number;
  tags: TagDefinition[];
}> = ({ students, movements, classCount, tags }) => {
  // Logic to calculate simulated state
  const { simulatedStudents, movedStudentIds } = useMemo(() => {
    const movedIds = new Set<string>();
    const mapping = new Map<string, string>(); // maskedName -> targetClassId

    movements.forEach(m => {
        // Normalize class ID (e.g., "1반" -> "1")
        const targetId = m.targetClass.replace(/[^0-9]/g, '');
        mapping.set(m.studentName, targetId);
    });

    const newStudents = students.map(s => {
      const masked = maskName(s.name);
      if (mapping.has(masked)) {
        movedIds.add(s.id);
        return { ...s, assignedClassId: mapping.get(masked)! };
      }
      return s;
    });

    return { simulatedStudents: newStudents, movedStudentIds: movedIds };
  }, [students, movements]);

  // Group by class
  const classes = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    for (let i = 1; i <= classCount; i++) {
        groups[i.toString()] = [];
    }
    // Also handle unassigned if any (though AI assigns usually)
    simulatedStudents.forEach(s => {
        if (s.assignedClassId && groups[s.assignedClassId]) {
            groups[s.assignedClassId].push(s);
        }
    });
    return groups;
  }, [simulatedStudents, classCount]);

  // Sort class IDs numerically to ensure correct order (1, 2, ... 10)
  const sortedClassIds = Object.keys(classes).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
        <div className="p-3 border-b border-slate-200">
            <h5 className="text-base font-bold text-slate-700 flex items-center gap-2">
                <LayoutDashboard size={18} className="text-indigo-600" />
                전체 편성 시뮬레이션
                <span className="text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 ml-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1"></span>
                    이동하는 학생 강조됨
                </span>
            </h5>
        </div>
        {/* Adjusted Container for Scroll */}
        <div className="overflow-x-auto w-full pb-2">
            <div className="flex gap-3 min-w-max p-4 pr-6 items-start">
                {sortedClassIds.map(classId => (
                    <div key={classId} className="w-52 bg-white rounded-lg border border-slate-200 flex flex-col shadow-sm flex-shrink-0">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-lg flex justify-between items-center">
                            <span className="font-bold text-base text-slate-700">{classId}반</span>
                            <span className="text-sm bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">{classes[classId].length}명</span>
                        </div>
                        {/* Ensure full height is shown by removing overflow-y and height constraints */}
                        <div className="p-2 space-y-2">
                            {classes[classId].length === 0 && (
                                <div className="text-center text-sm text-gray-300 py-4">학생 없음</div>
                            )}
                            {classes[classId].sort((a,b)=>a.name.localeCompare(b.name)).map(s => {
                                const isMoved = movedStudentIds.has(s.id);
                                
                                // Find movement info if this student moved
                                let movementLabel = '이동';
                                if (isMoved) {
                                    // We need to find the movement that caused this
                                    const masked = maskName(s.name);
                                    const move = movements.find(m => m.studentName === masked);
                                    if (move) {
                                        const fromClass = move.currentClass.replace(/반$/, '');
                                        movementLabel = `변경 전: ${fromClass}반`;
                                    }
                                }

                                return (
                                    <div key={s.id} className={`
                                        p-2.5 rounded border text-base relative transition-all
                                        ${isMoved 
                                            ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-200 shadow-sm z-10' 
                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                        }
                                    `}>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className={`font-bold ${isMoved ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {s.name}
                                            </span>
                                            {isMoved && (
                                                <span className="text-xs font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm animate-pulse whitespace-nowrap">
                                                    {movementLabel}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {s.gender && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded border ${s.gender === 'male' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {s.gender === 'male' ? '남' : '여'}
                                                </span>
                                            )}
                                            {s.tagIds.map(tid => {
                                                const t = tags.find(tag => tag.id === tid);
                                                return t ? (
                                                    <span key={tid} className={`text-xs px-1.5 py-0.5 rounded border border-transparent ${t.colorBg} ${t.colorText}`}>
                                                        {t.label}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export const AiReportModal: React.FC<AiReportModalProps> = ({ 
  isOpen, onClose, analysisResult, students, tags, classCount, onReanalyze, isLoading 
}) => {
  const [expandedSimulations, setExpandedSimulations] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  // 1. Loading State Overlay
  if (isLoading) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
             <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center animate-in fade-in zoom-in duration-200 max-w-sm w-full">
                  <div className="animate-spin text-indigo-600 mb-4">
                      <RefreshCcw size={40} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">AI분석을 재실행 중입니다...</h2>
                  <p className="text-gray-500 text-base text-center">학생들의 특성과 균형을 면밀히 검토하고 있습니다.</p>
             </div>
        </div>
    );
  }

  // 2. No Result / Closed State
  if (!analysisResult) return null;

  // 3. Error State
  if (typeof analysisResult === 'string') {
    const renderMarkdown = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
          <div 
            className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <Wand2 size={24} className="text-purple-200" />
                AI 분석 결과
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed bg-white p-6 rounded-lg shadow-sm border border-purple-100 text-lg">
                   {renderMarkdown(analysisResult)}
               </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end gap-2">
              <button onClick={onClose} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-colors text-base">닫기</button>
              {onReanalyze && (
                  <button 
                    onClick={onReanalyze}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2 text-base"
                  >
                    <RefreshCcw size={18} /> 다시 시도
                  </button>
              )}
            </div>
          </div>
        </div>
      );
  }

  // 4. Success State (Structured Data)
  const { currentScore, predictedScore, overallReview, classBriefs, classDetails, suggestions } = analysisResult;
  
  // Use passed classCount or fallback to derived
  const finalClassCount = classCount || classDetails.length;

  // Chart Data Preparation
  const barChartData = classDetails.map(c => ({
    name: `${c.classId.replace(/반$/, '')}반`,
    Risk: c.riskScore,
    Balance: c.balanceScore
  }));

  // Helper to find original student by masked name (best effort)
  const getOriginalStudent = (maskedName: string) => {
      if (!students) return undefined;
      // Try to find a student whose masked name matches
      return students.find(s => maskName(s.name) === maskedName);
  };

  const toggleSimulation = (idx: number) => {
    const next = new Set(expandedSimulations);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedSimulations(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md z-10">
          <h2 className="font-bold text-2xl flex items-center gap-2">
            <Wand2 size={28} className="text-purple-200" />
            AI 분석 리포트
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-8">
            
            {/* 1. Overall Balance & Evaluation */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 className="text-gray-500 font-medium mb-5 uppercase tracking-wide text-sm">현재 전체 균형 점수</h3>
                    <div className="relative flex items-center justify-center">
                        <svg className="w-36 h-36 transform -rotate-90">
                            <circle cx="72" cy="72" r="60" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                            <circle 
                                cx="72" cy="72" r="60" 
                                stroke={currentScore >= 80 ? '#22c55e' : currentScore >= 60 ? '#3b82f6' : '#ef4444'} 
                                strokeWidth="12" 
                                fill="none" 
                                strokeDasharray={376.99} 
                                strokeDashoffset={376.99 - (376.99 * currentScore) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-gray-800">{currentScore}</span>
                            <span className="text-sm text-gray-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Comment Card */}
                <div className="md:col-span-2 bg-white p-7 rounded-2xl shadow-sm border border-gray-200 relative flex flex-col">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                     <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wide text-sm flex items-center gap-1">
                        <TrendingUp size={16} /> 종합 평가
                     </h3>
                     <div className="flex-1 flex items-center">
                        <p className="text-gray-700 leading-relaxed text-xl font-medium break-keep">
                            "{overallReview}"
                        </p>
                     </div>
                </div>
            </section>

            {/* Split Section: Chart & Briefs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 2. Class Indicators (Chart) */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                    <h3 className="text-gray-800 font-bold text-lg mb-6 flex items-center gap-2">
                        <Activity size={22} className="text-indigo-500" />
                        반별 지표 비교
                    </h3>
                    {/* Fixed height to prevent vertical stretching */}
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 13}} domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '14px' }}
                                    cursor={{fill: '#f9fafb'}}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} iconType="circle" />
                                <Bar dataKey="Risk" name="지도 난이도(Risk)" fill="#f87171" radius={[4, 4, 0, 0]} barSize={34} />
                                <Bar dataKey="Balance" name="균형 점수(Balance)" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={34} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* 4. Class Briefs (Status) */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                    <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2">
                        <Star size={22} className="text-amber-500" />
                        반별 핵심 현황
                    </h3>
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[300px] lg:max-h-none pr-1">
                        {classBriefs.map((brief, idx) => (
                            <div key={idx} className="flex gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors">
                                <CheckCircle className="text-amber-600VX flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-base text-gray-700 leading-snug">{brief}</p>
                            </div>
                        ))}
                        {classBriefs.length === 0 && (
                            <div className="text-center text-gray-400 py-4 flex-1 flex items-center justify-center text-base">특별한 제안 사항이 없습니다.</div>
                        )}
                    </div>
                </section>
            </div>

            {/* 3. Current Class Detailed Analysis */}
            <section>
                <h3 className="text-gray-800 font-bold text-lg mb-4 flex items-center gap-2 px-1">
                    <div className="w-1.5 h-6 bg-gray-500 rounded-full"></div>
                    현재 학급별 상세 분석
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {classDetails.map((cls) => (
                        <div key={cls.classId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                                <h4 className="text-xl font-bold text-gray-800 mt-1">
                                    {cls.classId.replace(/반$/, '')}반
                                </h4>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                                        {cls.statusTitle}
                                    </span>
                                    <div className="flex gap-2 text-sm font-bold">
                                        <span className={`px-2 py-1 rounded bg-red-100 text-red-700`}>Risk: {cls.riskScore}</span>
                                        <span className={`px-2 py-1 rounded bg-blue-100 text-blue-700`}>Bal: {cls.balanceScore}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="text-sm font-bold text-gray-400 uppercase mb-1">현황</h5>
                                    <p className="text-base text-gray-600 leading-snug">{cls.currentSituation}</p>
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-400 uppercase mb-1">긍정적 요소</h5>
                                    <p className="text-base text-green-700 leading-snug bg-green-50 p-2.5 rounded">{cls.positiveFactors}</p>
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-400 uppercase mb-1">조언</h5>
                                    <p className="text-base text-amber-700 leading-snug bg-amber-50 p-2.5 rounded">{cls.advice}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. AI Suggested Assignment Analysis (Optimization Moves) */}
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-7 rounded-2xl border border-indigo-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-gray-800 font-bold text-xl flex items-center gap-2">
                        <Wand2 className="text-indigo-600" size={24} />
                        AI가 제안한 최적 편성안
                    </h3>
                    <div className="bg-white px-5 py-2 rounded-full border border-indigo-100 text-base text-gray-500 shadow-sm">
                        AI가 분석한 가장 효과적인 제안입니다.
                    </div>
                </div>

                {suggestions && suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
                        {suggestions.map((sug, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-indigo-100 flex flex-col overflow-hidden hover:shadow-md transition-all">
                                
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-5 border-b border-gray-100 pb-5">
                                         <div>
                                             <div className="flex items-center gap-2 mb-2">
                                                 <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-2.5 py-0.5 rounded-full">추천 {idx + 1}</span>
                                                 <h4 className="font-bold text-xl text-gray-800">{sug.title}</h4>
                                             </div>
                                             <p className="text-base text-gray-600">{sug.reason}</p>
                                         </div>

                                         <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex-shrink-0">
                                             <div className="text-right">
                                                 <span className="text-xs uppercase text-gray-400 font-bold block">예상 점수</span>
                                                 <span className="text-3xl font-black text-indigo-600 leading-none">{sug.predictedScore}</span>
                                             </div>
                                             {sug.predictedScore > currentScore && (
                                                 <div className="bg-green-100 text-green-700 text-sm font-bold px-2.5 py-1 rounded-md">
                                                     +{sug.predictedScore - currentScore}
                                                 </div>
                                             )}
                                         </div>
                                    </div>

                                    {/* Movements List */}
                                    <div className="space-y-3 mb-5">
                                        {sug.movements.map((move, mIdx) => {
                                            const originalStudent = getOriginalStudent(move.studentName);
                                            return (
                                                <div key={mIdx} className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                                                    
                                                    {/* Student Info */}
                                                    <div className="flex items-center gap-3 min-w-[160px]">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${
                                                            originalStudent?.gender === 'female' 
                                                                ? 'bg-rose-100 text-rose-600' 
                                                                : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {originalStudent?.gender === 'female' ? '여' : '남'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-base">
                                                                {move.studentName}
                                                            </div>
                                                            {/* Tags */}
                                                            {originalStudent && tags && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {originalStudent.tagIds.map(tid => {
                                                                        const t = tags.find(tag => tag.id === tid);
                                                                        return t ? (
                                                                            <span key={t.id} className={`text-xs px-1.5 py-0.5 rounded leading-none ${t.colorBg} ${t.colorText}`}>
                                                                                {t.label}
                                                                            </span>
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Direction */}
                                                    <div className="flex-1 flex items-center justify-center px-4">
                                                        <div className="flex items-center gap-3 text-base font-medium w-full max-w-[240px]">
                                                            <div className="flex-1 text-center py-1.5 bg-white border border-gray-200 rounded text-gray-600">
                                                                {(move.currentClass && move.currentClass !== '미배정') 
                                                                    ? `${move.currentClass.replace(/반$/, '')}반` 
                                                                    : '미배정'}
                                                            </div>
                                                            <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
                                                            <div className="flex-1 text-center py-1.5 bg-indigo-600 text-white rounded shadow-sm">
                                                                {move.targetClass.replace(/반$/, '')}반
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Expected Effect */}
                                    <div className="text-base bg-green-50 text-green-800 p-3.5 rounded-lg border border-green-100 flex gap-2">
                                        <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                                        <span><strong>기대 효과:</strong> {sug.expectedEffect}</span>
                                    </div>

                                    {/* Simulation Toggle */}
                                    <div className="mt-5 pt-3 border-t border-dashed border-gray-200">
                                        <button 
                                            onClick={() => toggleSimulation(idx)}
                                            className="flex items-center gap-2 text-base font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-full justify-center py-2"
                                        >
                                            {expandedSimulations.has(idx) ? (
                                                <>
                                                    <ChevronUp size={18} />
                                                    시뮬레이션 접기
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={18} />
                                                    전체 편성 시뮬레이션 보기
                                                </>
                                            )}
                                        </button>
                                        
                                        {/* Render Simulation View if expanded */}
                                        {expandedSimulations.has(idx) && students && tags && (
                                            <SimulationView 
                                                students={students}
                                                movements={sug.movements}
                                                classCount={finalClassCount}
                                                tags={tags}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-300">
                        <ThumbsUp className="mx-auto text-green-500 mb-3" size={40} />
                        <p className="text-gray-700 font-bold text-lg">현재 편성이 최적 상태입니다.</p>
                        <p className="text-base text-gray-500 mt-1">추가적인 최적화 제안이 없습니다.</p>
                    </div>
                )}
            </section>

            <div className="mt-8 text-center text-sm text-gray-400">
                ※주의: 본 분석 결과는 AI에 의해 생성되었으며, 반드시 참고용으로만 활용해 주시기 바랍니다. 최종 결정은 학교의 상황을 고려하여 진행해 주세요.
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-5 border-t bg-white flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-base"
            >
                닫기
            </button>
            {onReanalyze && (
                <button 
                    onClick={onReanalyze}
                    className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 text-base"
                >
                    <RefreshCcw size={20} />
                    AI 분석 재실행
                </button>
            )}
        </div>
      </div>
    </div>
  );
};