import React, { useState, useEffect } from 'react';
import { 
    Plus, Settings, Wand2, Download,
    X, Square, RefreshCcw,
    ChevronLeft, ChevronRight, HelpCircle,
    Undo, Redo, CheckSquare, FileText
} from 'lucide-react';

import { 
    Student, TagDefinition, SchoolLevel, SeparationRule, AppState, AiAnalysisResult 
} from './types';
import { 
    INITIAL_TAGS, TAG_COLORS, UNASSIGNED_ID, MAX_CAPACITY
} from './constants';
import { ClassColumn } from './components/ClassColumn';
import { StudentCard } from './components/StudentCard';
import { StatsPanel } from './components/StatsPanel';
import { HelpModal } from './components/HelpModal';
import { StudentModal } from './components/StudentModal';
import { AiReportModal } from './components/AiReportModal';
import { Sidebar } from './components/Sidebar';
import { analyzeClasses } from './services/geminiService';
import { exportToExcel } from './utils/exportUtils';
import { useTouchDrag } from './hooks/useTouchDrag';

// --- MAIN APP ---

function App() {
  // --- STATE ---
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('ELEMENTARY_MIDDLE');
  const [classCount, setClassCount] = useState<number>(3);
  const [students, setStudents] = useState<Student[]>([]);
  const [tags, setTags] = useState<TagDefinition[]>(INITIAL_TAGS);
  const [separationRules, setSeparationRules] = useState<SeparationRule[]>([]);
  
  // History State
  const [history, setHistory] = useState<{ past: AppState[]; future: AppState[] }>({ past: [], future: [] });

  // UI State
  const [showStats, setShowStats] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null); // If null, adding new
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Separation Creation State
  const [separationSelection, setSeparationSelection] = useState<string[]>([]);
  const [showSeparationMode, setShowSeparationMode] = useState(false);

  // Export State
  const [includeStats, setIncludeStats] = useState(false);

  // AI Analysis - Now supports structured data
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem('classHelperData');
    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        setSchoolLevel(parsed.schoolLevel);
        setClassCount(parsed.classCount);
        
        // Data Migration: Preserve existing gender or leave undefined
        const migratedStudents = (parsed.students || []).map(s => ({
            ...s,
            gender: s.gender
        }));
        setStudents(migratedStudents);
        
        setTags(parsed.tags);
        setSeparationRules(parsed.separationRules);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  useEffect(() => {
    const data: AppState = { schoolLevel, classCount, students, tags, separationRules };
    localStorage.setItem('classHelperData', JSON.stringify(data));
  }, [schoolLevel, classCount, students, tags, separationRules]);

  // --- HISTORY MANAGEMENT (UNDO/REDO) ---
  
  const saveHistory = () => {
    const current: AppState = { schoolLevel, classCount, students, tags, separationRules };
    setHistory(prev => ({
      past: [...prev.past, current],
      future: []
    }));
  };

  const undo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    // Save current to future
    const current: AppState = { schoolLevel, classCount, students, tags, separationRules };
    
    setHistory({
      past: newPast,
      future: [current, ...history.future]
    });
    
    // Restore
    setSchoolLevel(previous.schoolLevel);
    setClassCount(previous.classCount);
    setStudents(previous.students);
    setTags(previous.tags);
    setSeparationRules(previous.separationRules);
  };

  const redo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    // Save current to past
    const current: AppState = { schoolLevel, classCount, students, tags, separationRules };
    
    setHistory(prev => ({
      past: [...prev.past, current],
      future: newFuture
    }));

    // Restore
    setSchoolLevel(next.schoolLevel);
    setClassCount(next.classCount);
    setStudents(next.students);
    setTags(next.tags);
    setSeparationRules(next.separationRules);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, students, tags, separationRules, classCount, schoolLevel]);


  // --- HANDLERS: STUDENTS ---
  
  const handleDropStudent = (studentId: string, targetClassId: string) => {
      saveHistory(); // History
      setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          const finalClassId = targetClassId === '' ? null : targetClassId;
          return { ...s, assignedClassId: finalClassId };
      }));
  };

  const { touchDragState, onTouchDragStart } = useTouchDrag(handleDropStudent);

  const openStudentModal = (student?: Student) => {
    setEditingStudent(student || null);
    setShowStudentModal(true);
  };

  const saveStudent = (name: string, gender: 'male' | 'female' | undefined, tags: string[]) => {
    saveHistory(); // History

    if (editingStudent) {
        setStudents(prev => prev.map(s => 
            s.id === editingStudent.id 
                ? { ...s, name, gender, tagIds: tags }
                : s
        ));
    } else {
        const newStudent: Student = {
            id: Date.now().toString(),
            name,
            gender,
            tagIds: tags,
            assignedClassId: null // Start unassigned
        };
        setStudents(prev => [...prev, newStudent]);
    }
    setShowStudentModal(false);
  };

  const deleteStudent = (id: string) => {
    if (window.confirm("정말 이 학생을 삭제하시겠습니까?")) {
        saveHistory(); // History
        setStudents(prev => prev.filter(s => s.id !== id));
        // Also remove from rules
        setSeparationRules(prev => prev.map(r => ({
            ...r,
            studentIds: r.studentIds.filter(sid => sid !== id)
        })).filter(r => r.studentIds.length > 1)); // Remove rule if < 2 students
    }
  };

  // --- HANDLERS: TAGS ---

  const deleteTagDefinition = (tagId: string) => {
      if (window.confirm("이 Tag를 삭제하시겠습니까? 기존 학생들의 Tag도 사라집니다.")) {
          saveHistory(); // History
          setTags(prev => prev.filter(t => t.id !== tagId));
          setStudents(prev => prev.map(s => ({
              ...s,
              tagIds: s.tagIds.filter(tid => tid !== tagId)
          })));
      }
  };

  const handleAddTag = (name: string) => {
      const trimmedName = name.trim();
      if (trimmedName) {
          // 1. Check for Duplicate Name
          if (tags.some(t => t.label === trimmedName)) {
              alert("이미 존재하는 Tag 이름입니다.");
              return;
          }

          // 2. Find Available Unique Colors
          const usedBgColors = new Set(tags.map(t => t.colorBg));
          const availableColors = TAG_COLORS.filter(c => !usedBgColors.has(c.bg));

          let selectedColor;
          
          if (availableColors.length > 0) {
              selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
          } else {
              alert("사용 가능한 고유 색상이 모두 소진되어, 기존 색상과 중복될 수 있습니다.");
              selectedColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
          }

          saveHistory(); // History

          const newTag: TagDefinition = {
              id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              label: trimmedName,
              colorBg: selectedColor.bg,
              colorText: selectedColor.text
          };
          setTags(prev => [...prev, newTag]);
      }
  };

  // --- HANDLERS: SEPARATION ---

  const toggleSeparationSelect = (studentId: string) => {
      setSeparationSelection(prev => 
        prev.includes(studentId) 
            ? prev.filter(id => id !== studentId)
            : [...prev, studentId]
      );
  };

  const createSeparationRule = () => {
      if (separationSelection.length < 2) {
          alert("2명 이상의 학생을 선택해야 합니다.");
          return;
      }
      saveHistory(); // History
      const newRule: SeparationRule = {
          id: `rule-${Date.now()}`,
          studentIds: separationSelection
      };
      setSeparationRules(prev => [...prev, newRule]);
      setSeparationSelection([]);
      setShowSeparationMode(false);
  };

  const deleteRule = (ruleId: string) => {
      saveHistory(); // History
      setSeparationRules(prev => prev.filter(r => r.id !== ruleId));
  };

  // --- HANDLERS: UTILS & DATA MANAGEMENT ---

  const handleReset = () => {
      if (window.confirm("모든 데이터를 초기화하시겠습니까?")) {
          saveHistory(); // History before wipe
          setStudents([]);
          setSeparationRules([]);
          setTags(INITIAL_TAGS);
          setAiAnalysis(null);
      }
  };

  const handleLoadSampleData = () => {
    if (students.length > 0 && !window.confirm("현재 데이터가 모두 삭제되고 샘플 데이터로 대체됩니다. 계속하시겠습니까?")) {
        return;
    }
    
    saveHistory();

    const capacityPerClass = MAX_CAPACITY[schoolLevel];
    const totalCount = classCount * capacityPerClass;

    const lastNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍", "문", "손", "배", "백", "허"];
    const firstNames = ["민준", "서준", "도윤", "예준", "시우", "하준", "지호", "주원", "지후", "준우", "서윤", "서연", "지우", "지유", "하윤", "서현", "민서", "하은", "지아", "수아", "은지", "지원", "현우", "민재", "채원", "다은", "가은", "준영", "현준", "예은", "유진", "시현", "건우", "우진", "민규", "예원", "윤우", "서아", "연우", "하율", "다인", "연주", "승우", "지민", "유나", "가윤", "시은", "준호", "동현"];

    const generatedStudents: Student[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < totalCount; i++) {
        let name = "";
        let attempts = 0;
        while (attempts < 50) {
             const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
             const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
             const candidate = ln + fn;
             if (!usedNames.has(candidate)) {
                 name = candidate;
                 break;
             }
             attempts++;
        }
        if (!name) name = `학생${i+1}`; 
        usedNames.add(name);

        // 남녀 성비 6:4로 조정 (남 60%, 여 40%)
        const gender: 'male' | 'female' = Math.random() < 0.6 ? 'male' : 'female';

        const rand = Math.random();
        let tagCount = 0;
        if (rand > 0.7) tagCount = 2; 
        else if (rand > 0.15) tagCount = 1; 

        const shuffledTags = [...INITIAL_TAGS].sort(() => 0.5 - Math.random());
        const selectedTagIds = shuffledTags.slice(0, tagCount).map(t => t.id);

        // Auto-assign to classes evenly
        const assignedClassId = (Math.floor(i / capacityPerClass) + 1).toString();

        generatedStudents.push({
            id: `sample-${Date.now()}-${i}`,
            name,
            gender,
            tagIds: selectedTagIds,
            assignedClassId: assignedClassId
        });
    }

    setStudents(generatedStudents);
    setSeparationRules([]);
    setTags(INITIAL_TAGS); 
    setAiAnalysis(null);
    
    alert(`현재 설정(${schoolLevel === 'ELEMENTARY_MIDDLE' ? '초/중등' : '고등'}, ${classCount}학급)에 맞춰 ${totalCount}명의 샘플 데이터가 생성되어 각 반에 자동 배정되었습니다.`);
  };

  const handleSaveProject = () => {
      const data: AppState = {
          schoolLevel,
          classCount,
          students,
          tags,
          separationRules
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `반편성프로젝트_${new Date().toLocaleDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = (file: File) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              if (!json.students || !json.tags) {
                  throw new Error("올바르지 않은 프로젝트 파일 형식입니다.");
              }

              if (window.confirm("현재 작업 중인 내용이 덮어씌워집니다. 계속하시겠습니까?")) {
                  saveHistory(); // History
                  setSchoolLevel(json.schoolLevel || 'ELEMENTARY_MIDDLE');
                  setClassCount(json.classCount || 3);
                  
                  const loadedStudents = (json.students || []).map((s: any) => ({
                      ...s,
                      gender: s.gender
                  }));
                  setStudents(loadedStudents);
                  
                  setTags(json.tags || INITIAL_TAGS);
                  setSeparationRules(json.separationRules || []);
                  setAiAnalysis(null);
                  alert("성공적으로 불러왔습니다.");
              }
          } catch (error) {
              console.error(error);
              alert("파일을 불러오는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.");
          }
      };
      reader.readAsText(file);
  };

  const handleAIAnalyze = async () => {
      setIsAnalyzing(true);
      // setAiAnalysis(null); // Optional: clear previous result while loading
      const result = await analyzeClasses(students, tags, separationRules, classCount, schoolLevel);
      setAiAnalysis(result);
      setIsAnalyzing(false);
      setShowAiReport(true); // Automatically open report modal
  };

  const onExportExcel = () => {
    exportToExcel({
      classCount,
      students,
      tags,
      includeStats
    });
  };

  // --- RENDER HELPERS ---
  
  const unassignedStudents = students
    .filter(s => !s.assignedClassId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const classList = Array.from({ length: classCount }, (_, i) => (i + 1).toString());

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-800 relative">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        schoolLevel={schoolLevel}
        setSchoolLevel={setSchoolLevel}
        classCount={classCount}
        setClassCount={setClassCount}
        tags={tags}
        onAddTag={handleAddTag}
        onDeleteTag={deleteTagDefinition}
        separationRules={separationRules}
        separationSelection={separationSelection}
        showSeparationMode={showSeparationMode}
        setShowSeparationMode={setShowSeparationMode}
        onCreateRule={createSeparationRule}
        onDeleteRule={deleteRule}
        students={students}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onLoadSampleData={handleLoadSampleData}
        onReset={handleReset}
        onExportExcel={onExportExcel}
        includeStats={includeStats}
        setIncludeStats={setIncludeStats}
        saveHistory={saveHistory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <Settings size={20} />
                    </button>
                )}
                <h2 className="font-bold text-gray-800 text-lg">
                    {schoolLevel === 'ELEMENTARY_MIDDLE' ? '초등/중학' : '고등'} 반편성 보드
                </h2>
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                    전체 학생: {students.length}명
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Undo/Redo Buttons */}
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 mr-2">
                    <button 
                        onClick={undo}
                        disabled={history.past.length === 0}
                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors border-r border-gray-200"
                        title="실행 취소 (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button 
                        onClick={redo}
                        disabled={history.future.length === 0}
                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"
                        title="다시 실행 (Ctrl+Shift+Z)"
                    >
                        <Redo size={18} />
                    </button>
                </div>

                <button 
                    onClick={() => setShowHelpModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-300 transition-colors"
                    title="도움말"
                >
                    <HelpCircle size={16} /> 도움말
                </button>
                <button 
                    onClick={() => setShowStats(!showStats)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors border ${showStats ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    <Download size={16} className="rotate-180" /> 통계/분석
                </button>
                
                {/* AI Analysis Buttons */}
                <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70 shadow"
                >
                   {isAnalyzing ? <RefreshCcw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                   AI 분석
                </button>
                {aiAnalysis && !isAnalyzing && (
                    <button
                        onClick={() => setShowAiReport(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white text-purple-700 border border-purple-200 rounded text-sm font-medium hover:bg-purple-50 transition-colors shadow-sm"
                        title="분석 결과 다시 보기"
                    >
                         <FileText size={16} /> 리포트
                    </button>
                )}
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 bg-gray-50/50">
            
            {showStats ? (
                <div className="h-full overflow-y-auto">
                    <div className="w-full max-w-5xl mx-auto mt-4 mb-2 flex justify-end px-1">
                        <button 
                            onClick={() => setShowStats(false)} 
                            className="flex items-center gap-1 bg-white text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
                            title="통계/분석 닫기"
                        >
                            <span className="text-xs font-bold">닫기</span>
                            <X size={16} />
                        </button>
                    </div>
                    <StatsPanel students={students} tags={tags} classCount={classCount} />
                </div>
            ) : (
                <div className="flex h-full gap-4 w-full">
                    {/* Unassigned Column (Collapsible) */}
                    <div className={`flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0 ${isUnassignedOpen ? 'w-72' : 'w-12'}`}>
                        {isUnassignedOpen ? (
                             // Expanded View
                            <>
                                <div className="mb-2 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-700 whitespace-nowrap">미배정 학생 ({unassignedStudents.length})</h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => openStudentModal()}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded shadow transition-colors" title="학생 추가"
                                        >
                                            <Plus size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setIsUnassignedOpen(false)}
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded shadow transition-colors" title="접기"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div 
                                    className="bg-gray-100 rounded-xl p-2 border-2 border-dashed border-gray-300 flex-1 overflow-y-auto transition-colors hover:bg-gray-50"
                                    data-drop-zone={UNASSIGNED_ID}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const studentId = e.dataTransfer.getData('studentId');
                                        if (studentId) {
                                            handleDropStudent(studentId, '');
                                        }
                                    }}
                                >
                                    {showSeparationMode && (
                                        <div className="text-center text-xs text-indigo-600 mb-2 font-medium bg-indigo-50 py-1 rounded">
                                            분리할 학생들을 체크하세요
                                        </div>
                                    )}
                                    {unassignedStudents.map(student => (
                                        <div key={student.id} className="flex gap-2 mb-2">
                                            {showSeparationMode && (
                                                <button 
                                                    onClick={() => toggleSeparationSelect(student.id)}
                                                    className={`mt-3 ${separationSelection.includes(student.id) ? 'text-indigo-600' : 'text-gray-300'}`}
                                                >
                                                    {separationSelection.includes(student.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                            )}
                                            <div className="flex-1">
                                                <StudentCard 
                                                    student={student} 
                                                    allTags={tags} 
                                                    onEdit={(s) => openStudentModal(s)}
                                                    onDelete={deleteStudent}
                                                    onTouchDragStart={onTouchDragStart}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {unassignedStudents.length === 0 && (
                                        <div className="text-center text-gray-400 mt-10 text-sm">
                                            모든 학생이 배정되었습니다.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Collapsed View
                            <div 
                                className="h-full flex flex-col items-center pt-2 bg-gray-200 rounded-xl cursor-pointer hover:bg-gray-300 transition-colors border border-gray-300"
                                onClick={() => setIsUnassignedOpen(true)}
                                title="펼치기"
                            >
                                <button className="mb-4 text-gray-600">
                                    <ChevronRight size={20} />
                                </button>
                                <div className="flex-1 flex items-center justify-center">
                                     <span className="[writing-mode:vertical-lr] text-gray-600 font-bold tracking-widest text-sm whitespace-nowrap">
                                        미배정 학생 ({unassignedStudents.length})
                                     </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Class Columns */}
                    <div className="flex-1 flex gap-4 h-full overflow-x-auto pb-2 pl-2 border-l border-gray-200">
                        {classList.map(classId => (
                            <div key={classId} className="w-72 h-full flex-shrink-0">
                                <ClassColumn 
                                    id={classId}
                                    name={`${classId}반`}
                                    students={students.filter(s => s.assignedClassId === classId)}
                                    allTags={tags}
                                    schoolLevel={schoolLevel}
                                    separationRules={separationRules}
                                    onDropStudent={handleDropStudent}
                                    onEditStudent={(s) => openStudentModal(s)}
                                    onDeleteStudent={deleteStudent}
                                    onTouchDragStart={onTouchDragStart}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* TOUCH DRAG OVERLAY */}
      {touchDragState && (
        <div 
            style={{
                position: 'fixed',
                left: touchDragState.currentX,
                top: touchDragState.currentY,
                width: touchDragState.width,
                height: touchDragState.height,
                transform: 'translate(-50%, -50%) rotate(3deg)', 
                pointerEvents: 'none',
                zIndex: 9999,
                opacity: 0.9,
            }}
        >
             <StudentCard 
                student={touchDragState.student}
                allTags={tags}
                onEdit={() => {}}
                onDelete={() => {}}
                isGhost={true}
             />
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}
      
      {/* Ai Report Modal */}
      <AiReportModal 
        isOpen={showAiReport} 
        onClose={() => setShowAiReport(false)}
        analysisResult={aiAnalysis}
        students={students}
        tags={tags}
        classCount={classCount}
        onReanalyze={handleAIAnalyze}
        isLoading={isAnalyzing}
      />

      {/* Student Add/Edit Modal */}
      <StudentModal 
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSave={saveStudent}
        editingStudent={editingStudent}
        tags={tags}
      />
    </div>
  );
}

export default App;