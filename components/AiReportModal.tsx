import React from 'react';
import { X, Wand2, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, User, Star, Activity, ThumbsUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { AiAnalysisResult, Student, TagDefinition } from '../types';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AiAnalysisResult | string | null;
  students?: Student[];
  tags?: TagDefinition[];
}

// Local helper to match mask logic from service
const maskName = (name: string): string => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '○';
  return name[0] + '○' + name.slice(2);
};

export const AiReportModal: React.FC<AiReportModalProps> = ({ isOpen, onClose, analysisResult, students, tags }) => {
  if (!isOpen || !analysisResult) return null;

  // Render Logic for String (Fallback/Error)
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
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Wand2 size={20} className="text-purple-200" />
                AI 반편성 분석 결과
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed bg-white p-6 rounded-lg shadow-sm border border-purple-100 text-base">
                   {renderMarkdown(analysisResult)}
               </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end">
              <button onClick={onClose} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-colors">닫기</button>
            </div>
          </div>
        </div>
      );
  }

  // Render Logic for Structured Data
  const { currentScore, predictedScore, overallReview, classBriefs, classDetails, suggestions } = analysisResult;

  // Chart Data Preparation
  const barChartData = classDetails.map(c => ({
    name: `${c.classId}반`,
    Risk: c.riskScore,
    Balance: c.balanceScore
  }));

  // Helper to find original student by masked name (best effort)
  const getOriginalStudent = (maskedName: string) => {
      if (!students) return undefined;
      // Try to find a student whose masked name matches
      return students.find(s => maskName(s.name) === maskedName);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md z-10">
          <h2 className="font-bold text-xl flex items-center gap-2">
            <Wand2 size={24} className="text-purple-200" />
            AI 반편성 분석 리포트
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-8">
            
            {/* 1. Overall Balance & Evaluation */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[180px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wide text-xs">현재 전체 균형 점수</h3>
                    <div className="relative flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                            <circle 
                                cx="64" cy="64" r="56" 
                                stroke={currentScore >= 80 ? '#22c55e' : currentScore >= 60 ? '#3b82f6' : '#ef4444'} 
                                strokeWidth="12" 
                                fill="none" 
                                strokeDasharray={351.86} 
                                strokeDashoffset={351.86 - (351.86 * currentScore) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-gray-800">{currentScore}</span>
                            <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Comment Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative flex flex-col">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                     <h3 className="text-gray-500 font-medium mb-3 uppercase tracking-wide text-xs flex items-center gap-1">
                        <TrendingUp size={14} /> 종합 평가
                     </h3>
                     <div className="flex-1 flex items-center">
                        <p className="text-gray-700 leading-relaxed text-lg font-medium break-keep">
                            "{overallReview}"
                        </p>
                     </div>
                </div>
            </section>

            {/* 2. Class Indicators (Chart) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    반별 지표 비교
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{fill: '#f9fafb'}}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="Risk" name="지도 난이도(Risk)" fill="#f87171" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="Balance" name="균형 점수(Balance)" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* 3. Current Class Detailed Analysis */}
            <section>
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2 px-1">
                    <div className="w-1 h-5 bg-gray-500 rounded-full"></div>
                    현재 학급별 상세 분석
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {classDetails.map((cls) => (
                        <div key={cls.classId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                <h4 className="text-lg font-bold text-gray-800">{cls.classId}반</h4>
                                <div className="flex gap-2 text-xs font-bold">
                                    <span className={`px-2 py-1 rounded bg-red-100 text-red-700`}>Risk: {cls.riskScore}</span>
                                    <span className={`px-2 py-1 rounded bg-blue-100 text-blue-700`}>Bal: {cls.balanceScore}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">상태 요약</h5>
                                    <p className="text-sm font-semibold text-gray-800">{cls.statusTitle}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">현황</h5>
                                    <p className="text-sm text-gray-600 leading-snug">{cls.currentSituation}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">긍정적 요소</h5>
                                    <p className="text-sm text-green-700 leading-snug bg-green-50 p-2 rounded">{cls.positiveFactors}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">조언</h5>
                                    <p className="text-sm text-amber-700 leading-snug bg-amber-50 p-2 rounded">{cls.advice}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. AI Recommendations (Class Briefs) */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                    <Star size={20} className="text-amber-500" />
                    AI 제안 사항 (핵심 요약)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {classBriefs.map((brief, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors">
                            <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-gray-700 leading-snug">{brief}</p>
                        </div>
                    ))}
                    {classBriefs.length === 0 && (
                        <div className="text-center text-gray-400 py-4 col-span-2">특별한 제안 사항이 없습니다.</div>
                    )}
                </div>
            </section>

            {/* 5. AI Suggested Assignment Analysis (Optimization Moves) */}
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                        <Wand2 className="text-indigo-600" size={20} />
                        AI가 제안한 편성안 분석
                    </h3>
                    {predictedScore > 0 && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100">
                            <span className="text-xs font-bold text-gray-500 uppercase">예상 균형 점수</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through text-sm">{currentScore}</span>
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className={`text-xl font-black ${predictedScore > currentScore ? 'text-green-600' : 'text-gray-800'}`}>
                                    {predictedScore}
                                </span>
                                {predictedScore > currentScore && (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                        +{predictedScore - currentScore}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {suggestions && suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestions.map((sug, idx) => {
                            const originalStudent = getOriginalStudent(sug.studentName);
                            return (
                                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-all">
                                    {/* Decoration */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    
                                    <div className="mb-2">
                                        <h4 className="font-bold text-indigo-700 text-sm">{sug.title}</h4>
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    {sug.studentName}
                                                    {originalStudent && originalStudent.gender && (
                                                        <span className={`text-[10px] px-1.5 rounded-full ${originalStudent.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                                            {originalStudent.gender === 'male' ? '남' : '여'}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Tags */}
                                                {originalStudent && tags && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {originalStudent.tagIds.map(tid => {
                                                            const t = tags.find(tag => tag.id === tid);
                                                            return t ? (
                                                                <span key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded ${t.colorBg} ${t.colorText}`}>
                                                                    {t.label}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Movement Visualization */}
                                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg text-sm">
                                        <div className="flex-1 text-center font-bold text-gray-500 bg-white border border-gray-200 rounded py-1">
                                            {sug.currentClass || '미배정'}
                                        </div>
                                        <ArrowRight size={16} className="text-indigo-400" />
                                        <div className="flex-1 text-center font-bold text-white bg-indigo-500 rounded py-1 shadow-sm">
                                            {sug.targetClass}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                                        <p className="text-gray-700"><strong>이유:</strong> {sug.reason}</p>
                                        <p className="text-green-700"><strong>효과:</strong> {sug.expectedEffect}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-gray-300">
                        <ThumbsUp className="mx-auto text-green-500 mb-2" size={32} />
                        <p className="text-gray-600 font-medium">현재 편성이 최적 상태입니다.</p>
                        <p className="text-sm text-gray-400">추가적인 최적화 제안이 없습니다.</p>
                    </div>
                )}
            </section>

            <div className="mt-8 text-center text-xs text-gray-400">
                ※ 본 분석 결과는 AI에 의해 생성되었으며, 참고용으로만 활용해 주시기 바랍니다. 최종 결정은 학교의 상황을 고려하여 진행해 주세요.
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-200"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};