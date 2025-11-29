import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Student, TagDefinition } from '../types';
import { TagBadge } from './TagBadge';

interface StatsPanelProps {
  students: Student[];
  tags: TagDefinition[];
  classCount: number;
}

// 다중 선택을 지원하는 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // 누적 차트에서는 payload 순서가 쌓이는 순서와 반대일 수 있으므로 역순으로 보여주거나 그대로 보여줍니다.
    // 여기서는 위에서부터 아래로(쌓인 순서대로) 보여주기 위해 reverse()를 고려할 수 있으나, 기본 순서도 무방합니다.
    const reversedPayload = [...payload].reverse();

    return (
      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-sm z-50 min-w-[180px]">
        <p className="font-bold border-b border-gray-100 pb-1 mb-2 text-gray-800">{label}</p>
        <div className="space-y-3">
          {reversedPayload.map((entry: any, index: number) => {
            const studentNames = entry.payload[`${entry.dataKey}_names`] || [];
            
            // 값이 0인 항목은 툴팁에서 숨길지 여부 (여기서는 모두 표시)
            if (entry.value === 0) return null;

            return (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.fill }}
                  ></span>
                  <span className="font-medium text-gray-600">
                    {entry.name}: <span className="font-bold text-gray-900">{entry.value}명</span>
                  </span>
                </div>
                
                {studentNames.length > 0 && (
                  <div className="bg-gray-50 rounded p-2 ml-4">
                    <ul className="text-xs text-gray-700 space-y-1">
                      {studentNames.map((name: string, i: number) => (
                        <li key={i}>• {name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ students, tags, classCount }) => {
  // 다중 선택 상태 (Tag ID 배열)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // 초기 로딩 시 첫 번째 태그만 선택되도록 설정
  useEffect(() => {
    if (tags.length > 0 && selectedTagIds.length === 0) {
      setSelectedTagIds([tags[0].id]);
    }
  }, [tags]);

  // 태그 선택 토글 함수
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // 선택된 태그들에 대한 데이터 계산
  const data = useMemo(() => {
    if (selectedTagIds.length === 0) return [];

    return Array.from({ length: classCount }, (_, i) => {
      const classId = (i + 1).toString();
      const studentsInClass = students.filter(s => s.assignedClassId === classId);
      
      const rowData: any = { name: `${classId}반` };

      selectedTagIds.forEach(tagId => {
        const targetStudents = studentsInClass.filter(s => s.tagIds.includes(tagId));
        rowData[tagId] = targetStudents.length;
        rowData[`${tagId}_names`] = targetStudents.map(s => s.name);
      });

      return rowData;
    });
  }, [classCount, students, selectedTagIds]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-5xl mx-auto mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            반별 특성 상세 분석
          </h2>
          <p className="text-sm text-gray-500 mt-1">여러 Tag를 선택하면 누적 그래프로 비교할 수 있습니다.</p>
        </div>
      </div>
      
      {/* Multi-Select Filter Controls */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
          {tags.map(tag => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <TagBadge 
                  key={tag.id} 
                  tag={tag} 
                  isSelected={isSelected}
                  onClick={() => toggleTag(tag.id)}
                  className={`
                    text-sm py-1.5 px-3 border transition-all cursor-pointer
                    ${isSelected 
                      ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-md scale-105 opacity-100 font-bold' 
                      : 'opacity-60 hover:opacity-100 hover:scale-105'}
                  `}
              />
            );
          })}
        </div>
      </div>

      <div className="h-96 w-full mb-4">
        {selectedTagIds.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 14, fontWeight: 500}} 
                dy={10}
              />
              <YAxis 
                allowDecimals={false} 
                axisLine={false} 
                tickLine={false}
                tick={{fill: '#9ca3af'}}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              
              {/* 선택된 태그마다 Bar 생성 */}
              {tags.filter(t => selectedTagIds.includes(t.id)).map(tag => (
                <Bar 
                  key={tag.id}
                  dataKey={tag.id} 
                  name={tag.label} 
                  fill={getTagColorHex(tag.colorText)}
                  stackId="a" /* 모든 Bar에 동일한 stackId를 부여하여 누적 차트로 만듭니다. */
                  animationDuration={500}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            분석할 Tag를 하나 이상 선택해주세요.
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        * 그래프 막대에 마우스를 올리면 해당 항목의 학생 명단을 확인할 수 있습니다.
      </p>
    </div>
  );
};

// Helper to approximate hex from tailwind classes for charts
const getTagColorHex = (tailwindTextClass: string): string => {
    if (tailwindTextClass.includes('red')) return '#ef4444';
    if (tailwindTextClass.includes('orange')) return '#f97316';
    if (tailwindTextClass.includes('amber')) return '#f59e0b';
    if (tailwindTextClass.includes('yellow')) return '#eab308';
    if (tailwindTextClass.includes('lime')) return '#84cc16';
    if (tailwindTextClass.includes('green')) return '#22c55e';
    if (tailwindTextClass.includes('emerald')) return '#10b981';
    if (tailwindTextClass.includes('teal')) return '#14b8a6';
    if (tailwindTextClass.includes('cyan')) return '#06b6d4';
    if (tailwindTextClass.includes('sky')) return '#0ea5e9';
    if (tailwindTextClass.includes('blue')) return '#3b82f6';
    if (tailwindTextClass.includes('indigo')) return '#6366f1';
    if (tailwindTextClass.includes('violet')) return '#8b5cf6';
    if (tailwindTextClass.includes('purple')) return '#a855f7';
    if (tailwindTextClass.includes('fuchsia')) return '#d946ef';
    if (tailwindTextClass.includes('pink')) return '#ec4899';
    if (tailwindTextClass.includes('rose')) return '#f43f5e';
    if (tailwindTextClass.includes('slate')) return '#64748b';
    if (tailwindTextClass.includes('gray')) return '#6b7280';
    if (tailwindTextClass.includes('zinc')) return '#71717a';
    if (tailwindTextClass.includes('neutral')) return '#737373';
    if (tailwindTextClass.includes('stone')) return '#78716c';
    return '#6b7280';
};