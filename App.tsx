
import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, Plus, Settings, Wand2, Download, Trash2, 
    X, Square, RefreshCcw, Tag, FileDown,
    Save, Upload, ChevronLeft, ChevronRight, HelpCircle,
    Undo, Redo, CheckSquare, Database
} from 'lucide-react';

import { 
    Student, TagDefinition, SchoolLevel, SeparationRule, AppState 
} from './types';
import { 
    INITIAL_TAGS, TAG_COLORS, UNASSIGNED_ID
} from './constants';
import { ClassColumn } from './components/ClassColumn';
import { TagBadge } from './components/TagBadge';
import { StudentCard } from './components/StudentCard';
import { StatsPanel } from './components/StatsPanel';
import { HelpModal } from './components/HelpModal';
import { analyzeClasses } from './services/geminiService';
import * as XLSX from 'xlsx';

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
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null); // If null, adding new
  const [studentFormName, setStudentFormName] = useState('');
  const [studentFormGender, setStudentFormGender] = useState<'male' | 'female' | undefined>(undefined);
  const [studentFormTags, setStudentFormTags] = useState<string[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Tag Management State (Sidebar)
  const [newTagInput, setNewTagInput] = useState('');

  // Separation Creation State
  const [separationSelection, setSeparationSelection] = useState<string[]>([]);
  const [showSeparationMode, setShowSeparationMode] = useState(false);

  // Export State
  const [includeStats, setIncludeStats] = useState(false);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // File Input Ref for Loading Data
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TOUCH DRAG STATE ---
  const [touchDragState, setTouchDragState] = useState<{
      student: Student;
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      width: number;
      height: number;
  } | null>(null);

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
  
  const openStudentModal = (student?: Student) => {
    if (student) {
        setEditingStudent(student);
        setStudentFormName(student.name);
        setStudentFormGender(student.gender);
        setStudentFormTags(student.tagIds);
    } else {
        setEditingStudent(null);
        setStudentFormName('');
        setStudentFormGender(undefined); // Start unselected
        setStudentFormTags([]);
    }
    setShowStudentModal(true);
  };

  const saveStudent = () => {
    if (!studentFormName.trim()) return;
    
    saveHistory(); // History

    if (editingStudent) {
        setStudents(prev => prev.map(s => 
            s.id === editingStudent.id 
                ? { ...s, name: studentFormName, gender: studentFormGender, tagIds: studentFormTags }
                : s
        ));
    } else {
        const newStudent: Student = {
            id: Date.now().toString(),
            name: studentFormName,
            gender: studentFormGender,
            tagIds: studentFormTags,
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

  const handleDropStudent = (studentId: string, targetClassId: string) => {
      saveHistory(); // History
      setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          // If dropping to unassigned, targetClassId is empty string or UNASSIGNED_ID logic check
          const finalClassId = targetClassId === '' ? null : targetClassId;
          return { ...s, assignedClassId: finalClassId };
      }));
  };

  // --- HANDLERS: TOUCH DRAG ---

  const onTouchDragStart = (student: Student, e: React.TouchEvent, cardRect: DOMRect) => {
    const touch = e.touches[0];
    setTouchDragState({
      student,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      width: cardRect.width,
      height: cardRect.height
    });
  };

  useEffect(() => {
    if (!touchDragState) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault(); // Stop scrolling while dragging
      const touch = e.touches[0];
      setTouchDragState(prev => prev ? ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY
      }) : null);
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = target?.closest('[data-drop-zone]');
      
      if (dropZone && touchDragState) {
        const zoneId = dropZone.getAttribute('data-drop-zone');
        // 'unassigned' is the ID for the unassigned area
        const targetClassId = zoneId === UNASSIGNED_ID ? '' : zoneId;
        
        if (targetClassId !== null) {
            handleDropStudent(touchDragState.student.id, targetClassId);
        }
      }
      setTouchDragState(null);
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [touchDragState, students]); // Dependencies for drop logic

  // --- HANDLERS: TAGS ---

  const toggleTagInForm = (tagId: string) => {
      setStudentFormTags(prev => 
        prev.includes(tagId) 
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
      );
  };

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

  const addNewTag = () => {
      const name = newTagInput.trim();
      if (name) {
          // 1. Check for Duplicate Name
          if (tags.some(t => t.label === name)) {
              alert("이미 존재하는 Tag 이름입니다.");
              return;
          }

          // 2. Find Available Unique Colors
          const usedBgColors = new Set(tags.map(t => t.colorBg));
          const availableColors = TAG_COLORS.filter(c => !usedBgColors.has(c.bg));

          let selectedColor;
          
          if (availableColors.length > 0) {
              // Pick a random color from the unused ones
              selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
          } else {
              // Fallback if all colors are used (though with 20+ colors, this is rare)
              alert("사용 가능한 고유 색상이 모두 소진되어, 기존 색상과 중복될 수 있습니다.");
              selectedColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
          }

          saveHistory(); // History

          const newTag: TagDefinition = {
              id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              label: name,
              colorBg: selectedColor.bg,
              colorText: selectedColor.text
          };
          setTags(prev => [...prev, newTag]);
          setNewTagInput('');
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
          // Reset logic involves clearing state, but we can also just clear local storage and reload.
          // To support undo for reset, we should just set states to empty.
          setStudents([]);
          setSeparationRules([]);
          setTags(INITIAL_TAGS);
          // Optional: localStorage will update via useEffect
      }
  };

  const handleLoadSampleData = () => {
    if (students.length > 0 && !window.confirm("현재 데이터가 모두 삭제되고 샘플 데이터로 대체됩니다. 계속하시겠습니까?")) {
        return;
    }
    
    saveHistory();

    const sampleData = [
        { name: "강민우", gender: "male", tags: ["t3"] }, // 공격성
        { name: "김서연", gender: "female", tags: [] },
        { name: "박준호", gender: "male", tags: ["t2", "t9"] }, // 휠체어, 화장실지원
        { name: "이진아", gender: "female", tags: ["t5"] }, // 교사보조가능
        { name: "정현수", gender: "male", tags: ["t4"] }, // 잦은결석
        { name: "최수민", gender: "female", tags: ["t6"] }, // 학부모예민
        { name: "조민재", gender: "male", tags: [] },
        { name: "윤서윤", gender: "female", tags: ["t1", "t8"] }, // 기저귀, 분쇄식
        { name: "장동현", gender: "male", tags: ["t3", "t10"] }, // 공격성, 보행지원
        { name: "임지원", gender: "female", tags: [] },
        { name: "한승우", gender: "male", tags: ["t5"] },
        { name: "오하은", gender: "female", tags: ["t7"] }, // 베드사용
        { name: "서준영", gender: "male", tags: [] },
        { name: "신혜진", gender: "female", tags: ["t4"] },
        { name: "권영민", gender: "male", tags: ["t3"] },
        { name: "황지현", gender: "female", tags: ["t9"] },
        { name: "안재석", gender: "male", tags: ["t2"] },
        { name: "송예린", gender: "female", tags: ["t6"] },
        { name: "전상우", gender: "male", tags: [] },
        { name: "홍유진", gender: "female", tags: ["t5"] },
    ];

    const newStudents: Student[] = sampleData.map((d, i) => ({
        id: `sample-${Date.now()}-${i}`,
        name: d.name,
        gender: d.gender as 'male' | 'female',
        tagIds: d.tags,
        assignedClassId: null
    }));

    setStudents(newStudents);
    setSeparationRules([]);
    setSchoolLevel('ELEMENTARY_MIDDLE');
    setClassCount(3);
    setTags(INITIAL_TAGS); // Reset tags to ensure IDs match
    
    alert("샘플 데이터가 로드되었습니다. 드래그 앤 드롭으로 반편성을 체험해보세요.");
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

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              // Basic Validation
              if (!json.students || !json.tags) {
                  throw new Error("올바르지 않은 프로젝트 파일 형식입니다.");
              }

              if (window.confirm("현재 작업 중인 내용이 덮어씌워집니다. 계속하시겠습니까?")) {
                  saveHistory(); // History
                  setSchoolLevel(json.schoolLevel || 'ELEMENTARY_MIDDLE');
                  setClassCount(json.classCount || 3);
                  
                  // Preserve existing gender or undefined
                  const loadedStudents = (json.students || []).map((s: any) => ({
                      ...s,
                      gender: s.gender
                  }));
                  setStudents(loadedStudents);
                  
                  setTags(json.tags || INITIAL_TAGS);
                  setSeparationRules(json.separationRules || []);
                  alert("성공적으로 불러왔습니다.");
              }
          } catch (error) {
              console.error(error);
              alert("파일을 불러오는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.");
          } finally {
              // Reset input so same file can be loaded again if needed
              if (fileInputRef.current) {
                  fileInputRef.current.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const handleAIAnalyze = async () => {
      setIsAnalyzing(true);
      setAiAnalysis("");
      const result = await analyzeClasses(students, tags, separationRules, classCount, schoolLevel);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  // Helper function to render bold text from markdown-style **text**
  const renderAnalysisText = (text: string) => {
    // Split by double asterisks
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Remove asterisks and wrap in strong tag, NO colored background
            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  const handleExportExcel = () => {
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
              // AI 분석 결과를 텍스트로 변환 (마크다운 볼드 제거)
              const formattedAnalysis = aiAnalysis
                  .replace(/\*\*(.*?)\*\*/g, '$1') // Bold 제거
                  .split('\n'); // 줄바꿈으로 분리

              const analysisData = formattedAnalysis.map(line => [line]);
              const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
              
              // 열 너비 조정 (가독성 향상)
              analysisSheet['!cols'] = [{ wch: 120 }];
              
              XLSX.utils.book_append_sheet(workbook, analysisSheet, 'AI 분석 결과');
          }
      }

      // 파일 다운로드
      const fileName = `반편성결과_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
  };


  // --- RENDER HELPERS ---
  
  // 미배정 학생 목록 정렬 (가나다순)
  const unassignedStudents = students
    .filter(s => !s.assignedClassId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const classList = Array.from({ length: classCount }, (_, i) => (i + 1).toString());

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-800 relative">
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 shadow-xl
        ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}
      `}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
            <h1 className="font-bold text-lg flex items-center gap-2">
                <Users size={20} />
                반편성 도우미
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
                <X size={18} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
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
                        onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                        placeholder="새 Tag 이름"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={addNewTag}
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
                                onDelete={() => deleteTagDefinition(tag.id)}
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
                                onClick={createSeparationRule}
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
                                onClick={() => deleteRule(rule.id)}
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
                            onClick={handleSaveProject}
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
                            onChange={handleLoadProject}
                            accept=".json"
                            className="hidden" 
                        />
                         <button 
                            onClick={handleLoadSampleData}
                            className="col-span-2 bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 py-2 px-2 rounded text-xs font-boldMZ flex items-center justify-center gap-2 transition-all mt-1"
                        >
                            <Database size={16} />
                            Sample 데이터 자동입력
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
                            <label htmlFor="includeStats" className="text-xs text-gray-700 select-none cursor-pointer">분석 결과 포함</label>
                        </div>
                        <button 
                            onClick={handleExportExcel}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <FileDown size={16} /> Excel 저장
                        </button>
                    </div>
                </div>
            </section>

            <div className="pt-4 border-t border-gray-100">
                <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full p-2 hover:bg-red-50 rounded">
                    <RefreshCcw size={16} /> 데이터 초기화
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10">
            <div className="flex items-center gap-3">
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <Settings size={20} />
                    </button>
                )}
                <h2 className="font-bold text-gray-800 text-lg">
                    {schoolLevel === 'ELEMENTARY_MIDDLE' ? '초/중등' : '고등'} 반편성 보드
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
                <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70 shadow"
                >
                   {isAnalyzing ? <RefreshCcw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                   AI 분석
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gray-50/50">
            
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
                    {aiAnalysis && (
                        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mx-auto mt-4 border border-purple-100">
                            <h3 className="flex items-center gap-2 font-bold text-purple-800 mb-3">
                                <Wand2 size={18} /> AI 분석 결과
                            </h3>
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed bg-purple-50 p-4 rounded-lg">
                                {renderAnalysisText(aiAnalysis)}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex h-full gap-4 min-w-max">
                    {/* Unassigned Column (Collapsible) */}
                    <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isUnassignedOpen ? 'w-72' : 'w-12'}`}>
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
                    <div className="flex gap-4 h-full overflow-x-auto pb-2 pl-2 border-l border-gray-200">
                        {classList.map(classId => (
                            <div key={classId} className="w-72 h-full">
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
                // Center the dragged item on finger
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

      {/* Student Add/Edit Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editingStudent ? '학생 정보 수정' : '새 학생 등록'}
                    </h3>
                    <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* Name and Gender Row */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학생 정보</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    value={studentFormName}
                                    onChange={(e) => setStudentFormName(e.target.value)}
                                    placeholder="이름 입력"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                <label 
                                    className={`
                                        cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1
                                        ${studentFormGender === 'male' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}
                                    `}
                                >
                                    <input 
                                        type="radio" 
                                        name="gender" 
                                        value="male" 
                                        checked={studentFormGender === 'male'} 
                                        onChange={() => setStudentFormGender('male')}
                                        className="hidden" 
                                    />
                                    남
                                </label>
                                <div className="w-px h-4 bg-gray-300 mx-0.5"></div>
                                <label 
                                    className={`
                                        cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1
                                        ${studentFormGender === 'female' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}
                                    `}
                                >
                                    <input 
                                        type="radio" 
                                        name="gender" 
                                        value="female" 
                                        checked={studentFormGender === 'female'} 
                                        onChange={() => setStudentFormGender('female')}
                                        className="hidden" 
                                    />
                                    여
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">특성 Tag (선택)</label>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                            {tags.map(tag => (
                                <TagBadge 
                                    key={tag.id} 
                                    tag={tag} 
                                    onClick={() => toggleTagInForm(tag.id)}
                                    className={`
                                        cursor-pointer text-sm py-1 px-3 rounded-full border transition-all
                                        ${studentFormTags.includes(tag.id) 
                                            ? 'ring-2 ring-indigo-500 ring-offset-1 font-bold shadow-sm' 
                                            : 'opacity-60 hover:opacity-100 hover:bg-white'}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={() => setShowStudentModal(false)}
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={saveStudent}
                        disabled={!studentFormName.trim()}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        {editingStudent ? '수정 완료' : '등록하기'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
