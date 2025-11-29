import React from 'react';
import { Student, TagDefinition, SchoolLevel, SeparationRule } from '../types';
import { StudentCard } from './StudentCard';
import { MAX_CAPACITY, UNASSIGNED_ID } from '../constants';
import { AlertCircle } from 'lucide-react';

interface ClassColumnProps {
  id: string; // 'unassigned' or '1', '2', etc.
  name: string;
  students: Student[];
  allTags: TagDefinition[];
  schoolLevel: SchoolLevel;
  separationRules: SeparationRule[];
  onDropStudent: (studentId: string, targetClassId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const ClassColumn: React.FC<ClassColumnProps> = ({
  id,
  name,
  students,
  allTags,
  schoolLevel,
  separationRules,
  onDropStudent,
  onEditStudent,
  onDeleteStudent
}) => {
  const isUnassigned = id === UNASSIGNED_ID;
  const maxCapacity = MAX_CAPACITY[schoolLevel];
  const isOverCapacity = !isUnassigned && students.length > maxCapacity;
  
  // Conflict Detection
  const conflictingStudentIds = new Set<string>();
  let hasConflict = false;

  if (!isUnassigned) {
    separationRules.forEach(rule => {
      const studentsInThisClassForRule = students.filter(s => rule.studentIds.includes(s.id));
      if (studentsInThisClassForRule.length > 1) {
        hasConflict = true;
        studentsInThisClassForRule.forEach(s => conflictingStudentIds.add(s.id));
      }
    });
  }

  // [수정됨] 학생 목록을 가나다순으로 정렬
  const sortedStudents = [...students].sort((a, b) => 
    a.name.localeCompare(b.name, 'ko')
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isOverCapacity && !isUnassigned) {
        // Optional: Change cursor to indicate full?
        // But users might still want to swap, so we allow drop but show visual warning
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (studentId) {
      onDropStudent(studentId, isUnassigned ? '' : id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        flex flex-col rounded-xl border-2 transition-colors min-h-[400px] h-full
        ${isUnassigned 
          ? 'bg-gray-50 border-dashed border-gray-300' 
          : 'bg-white shadow-sm'
        }
        ${isOverCapacity ? 'border-red-400 bg-red-50' : !isUnassigned ? 'border-blue-100' : ''}
        ${hasConflict ? 'border-red-500 ring-2 ring-red-100' : ''}
      `}
    >
      {/* Header */}
      <div className={`
        p-3 border-b rounded-t-xl flex justify-between items-center
        ${isUnassigned ? 'bg-gray-100' : hasConflict ? 'bg-red-100' : 'bg-blue-50'}
      `}>
        <h3 className={`font-bold ${hasConflict ? 'text-red-800' : 'text-gray-700'}`}>
          {name}
        </h3>
        <div className="flex items-center gap-2">
           {hasConflict && (
              <span className="text-red-600 flex items-center text-xs font-bold" title="분리 배정 위반!">
                <AlertCircle size={16} className="mr-1" /> 위반
              </span>
           )}
           <span className={`
             text-sm font-medium px-2 py-0.5 rounded-full
             ${isOverCapacity 
                ? 'bg-red-500 text-white' 
                : students.length === maxCapacity 
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'}
           `}>
             {students.length} { !isUnassigned && `/ ${maxCapacity}`}
           </span>
        </div>
      </div>

      {/* Student List */}
      <div className="p-2 flex-1 overflow-y-auto no-scrollbar">
        {sortedStudents.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic min-h-[100px]">
            {isUnassigned ? '이곳에 학생이 대기합니다.' : '학생을 드래그하세요.'}
          </div>
        )}
        {sortedStudents.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            allTags={allTags}
            isWarning={conflictingStudentIds.has(student.id)}
            onEdit={onEditStudent}
            onDelete={onDeleteStudent}
          />
        ))}
      </div>
    </div>
  );
};