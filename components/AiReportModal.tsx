
import React from 'react';
import { X, Wand2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { AiAnalysisResult } from '../types';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AiAnalysisResult | string | null;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({ isOpen, onClose, analysisResult }) => {
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
  const { overallScore, overallComment, classes, recommendations } = analysisResult;

  // Chart Data Preparation
  const barChartData = classes.map(c => ({
    name: `${c.classId}반`,
    Risk: c.riskScore,
    Balance: c.balanceScore
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            
            {/* Top Section: Overall Score & Comment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Score Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 className="text-gray-500 font-medium mb-2 uppercase tracking-wide text-xs">전체 균형 점수</h3>
                    <div className="relative flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                            <circle 
                                cx="64" cy="64" r="56" 
                                stroke={overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#3b82f6' : '#ef4444'} 
                                strokeWidth="12" 
                                fill="none" 
                                strokeDasharray={351.86} 
                                strokeDashoffset={351.86 - (351.86 * overallScore) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-gray-800">{overallScore}</span>
                            <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Comment Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                     <h3 className="text-gray-500 font-medium mb-3 uppercase tracking-wide text-xs flex items-center gap-1">
                        <TrendingUp size={14} /> 종합 평가
                     </h3>
                     <p className="text-gray-700 leading-relaxed text-lg font-medium break-keep">
                        "{overallComment}"
                     </p>
                </div>
            </div>

            {/* Middle Section: Charts & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* Class Comparison Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
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
                                <Bar dataKey="Risk" name="지도 난이도(Risk)" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Balance" name="균형 점수(Balance)" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recommendations List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                        AI 제안 사항
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-64 custom-scrollbar">
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors">
                                <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-gray-700 leading-snug">{rec}</p>
                            </div>
                        ))}
                        {recommendations.length === 0 && (
                            <div className="text-center text-gray-400 py-10">특별한 제안 사항이 없습니다.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Class Details Cards */}
            <div>
                <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2 px-1">
                    <div className="w-1 h-5 bg-gray-500 rounded-full"></div>
                    학급별 상세 분석
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <div key={cls.classId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                <h4 className="text-lg font-bold text-gray-800">{cls.classId}반</h4>
                                <div className="flex gap-2 text-xs font-bold">
                                    <span className={`px-2 py-1 rounded bg-red-100 text-red-700`}>Risk: {cls.riskScore}</span>
                                    <span className={`px-2 py-1 rounded bg-blue-100 text-blue-700`}>Bal: {cls.balanceScore}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed min-h-[60px]">
                                {cls.comment}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

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
