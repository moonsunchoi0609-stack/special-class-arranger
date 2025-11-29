import React, { useState, useRef } from 'react';
import { 
  Users, X, Settings, Plus, Tag, Trash2, FileDown, 
  Save, Upload, Database, RefreshCcw 
} from 'lucide-react';
import { TagDefinition, SchoolLevel, SeparationRule, Student } from '../types';
import { TagBadge } from './TagBadge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Settings
  schoolLevel: SchoolLevel;
  setSchoolLevel: (level: SchoolLevel) => void;
  classCount: number;
  setClassCount: (count: number) => void;
  
  // Tags
  tags: TagDefinition[];
  onAddTag: (name: string) => void;
  onDeleteTag: (id: string) => void;
  
  // Separation
  separationRules: SeparationRule[];
  separationSelection: string[];
  showSeparationMode: boolean;
  setShowSeparationMode: (show: boolean) => void;
  onCreateRule: () => void;
  onDeleteRule: (id: string) => void;
  students: Student[]; // Needed to show names in rules
  
  // Data Management
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onLoadSampleData: () => void;
  onReset: () => void;
  onExportExcel: () => void;
  includeStats: boolean;
  setIncludeStats: (include: boolean) => void;
  
  // Utils
  saveHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose,
  schoolLevel, setSchoolLevel,
  classCount, setClassCount,
  tags, onAddTag, onDeleteTag,
  separationRules, separationSelection, showSeparationMode, setShowSeparationMode, onCreateRule, onDeleteRule, students,
  onSaveProject, onLoadProject, onLoadSampleData, onReset, onExportExcel, includeStats, setIncludeStats,
  saveHistory
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNewTag = () => {
    onAddTag(newTagInput);
    setNewTagInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
    }
    // Reset input value to allow loading the same file again
    e.target.value = '';
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 shadow-xl
      ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}
    `}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Users size={20} />
          반편성 도우미
        </h1>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          
          {/* 1. Settings */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">설정</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학교급 (정원)</label>
                <div className="flex bg-gray-100 rounded p-1">
                  <button 
                    onClick={() => {
                      saveHistory();
                      setSchoolLevel('ELEMENTARY_MIDDLE');
                    }}
                    className={`flex-1 py-1 text-xs rounded transition-colors ${schoolLevel === 'ELEMENTARY_MIDDLE' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    초등/중학 (6명)
                  </button>
                  <button 
                    onClick={() => {
                      saveHistory();
                      setSchoolLevel('HIGH');
                    }}
                    className={`flex-1 py-1 text-xs rounded transition-colors ${schoolLevel === 'HIGH' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    고등 (7명)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">총 학급 수: {classCount}</label>
                <input 
                  type="range" min="1" max="10" 
                  value={classCount} 
                  onMouseDown={saveHistory} // Snapshot before drag
                  onChange={(e) => setClassCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span><span>10</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Tag Management */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag size={12} /> 특성 Tag 관리
            </h2>
            
            {/* Input Area */}
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                placeholder="새 Tag 이름"
                className="w-40 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                onClick={handleAddNewTag}
                className="bg-gray-100 text-gray-600 px-3 py-1 rounded border hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <TagBadge 
                    key={tag.id} 
                    tag={tag} 
                    onDelete={() => onDeleteTag(tag.id)}
                    className="cursor-default"
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-right">
                * X버튼을 눌러 Tag삭제
              </p>
            </div>
          </section>

          {/* 3. Separation Rules */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">분리 배정 그룹</h2>
              <button 
                onClick={() => setShowSeparationMode(!showSeparationMode)}
                className={`text-xs px-2 py-1 rounded border ${showSeparationMode ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600'}`}
              >
                {showSeparationMode ? '완료' : '그룹 추가'}
              </button>
            </div>
            
            {showSeparationMode && (
              <div className="mb-3 bg-indigo-50 p-2 rounded text-sm border border-indigo-100">
                <p className="text-indigo-800 mb-2">미배정 목록에서 학생을 선택하세요.</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{separationSelection.length}명 선택됨</span>
                  <button 
                    onClick={onCreateRule}
                    disabled={separationSelection.length < 2}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                  >
                    그룹 생성
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {separationRules.length === 0 && (
                <p className="text-xs text-gray-400 italic">등록된 그룹이 없습니다.</p>
              )}
              {separationRules.map((rule, idx) => (
                <div key={rule.id} className="bg-white border p-2 rounded shadow-sm text-sm relative group">
                  <div className="font-bold text-gray-700 mb-1">그룹 #{idx + 1}</div>
                  <div className="text-gray-500 leading-tight">
                    {rule.studentIds.map(sid => students.find(s => s.id === sid)?.name).join(', ')}
                  </div>
                  <button 
                    onClick={() => onDeleteRule(rule.id)}
                    className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Data Management (Export/Import) */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FileDown size={12} /> 데이터 관리
            </h2>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
              
              {/* Save/Load Project */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onSaveProject}
                  className="bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 py-2 px-2 rounded text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Save size={16} />
                  프로젝트 저장
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 py-2 px-2 rounded text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Upload size={16} />
                  불러오기
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden" 
                />
                <button 
                  onClick={onLoadSampleData}
                  className="col-span-2 bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all mt-1"
                >
                  <Database size={16} />
                  샘플 데이터 자동입력
                </button>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="includeStats"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="includeStats" className="text-xs text-gray-700 select-none cursor-pointer">통계/분석 포함</label>
                </div>
                <button 
                  onClick={onExportExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <FileDown size={16} /> Excel 저장
                </button>
              </div>
            </div>
          </section>
          
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100">
          <button onClick={onReset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full p-2 hover:bg-red-50 rounded">
            <RefreshCcw size={16} /> 데이터 초기화
          </button>
        </div>
      </div>
    </div>
  );
};