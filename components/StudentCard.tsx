import React from 'react';
import { Pencil, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { Student, TagDefinition } from '../types';
import { TagBadge } from './TagBadge';

interface StudentCardProps {
  student: Student;
  allTags: TagDefinition[];
  isWarning?: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  allTags,
  isWarning,
  onEdit,
  onDelete
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('studentId', student.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Sort tags based on the order in allTags
  const studentTags = allTags
    .filter(tag => student.tagIds.includes(tag.id));

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        relative group flex flex-col bg-white border rounded-lg p-3 shadow-sm mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all
        ${isWarning ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1">
          <GripVertical size={14} className="text-gray-400" />
          <span className="font-bold text-gray-800">{student.name}</span>
          {isWarning && <AlertTriangle size={16} className="text-red-500 ml-1" />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(student)}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
            title="수정"
          >
            <Pencil size={14} />
          </button>
          {!student.assignedClassId && (
              <button
              onClick={() => onDelete(student.id)}
              className="p-1 hover:bg-red-100 rounded text-red-500"
              title="삭제"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap">
        {studentTags.map(tag => (
          <TagBadge key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  );
};