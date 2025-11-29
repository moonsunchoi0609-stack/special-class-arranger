import React from 'react';
import { TagDefinition } from '../types';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: TagDefinition;
  onClick?: () => void;
  onDelete?: () => void; // Added for explicit delete action
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  isSelected?: boolean; // For toggle visualization
}

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  onClick, 
  onDelete, 
  onContextMenu, 
  className = '',
  isSelected
}) => {
  return (
    <span
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 select-none transition-all
        ${tag.colorBg} ${tag.colorText}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${isSelected === false ? 'opacity-40 grayscale' : ''} 
        ${className}
      `}
    >
      {tag.label}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => {
            // Prevent drag or other mouse down events from interfering
            e.stopPropagation();
          }}
          className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 text-current transition-colors focus:outline-none cursor-pointer flex items-center justify-center min-w-[16px] min-h-[16px]"
          title="삭제"
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </span>
  );
};