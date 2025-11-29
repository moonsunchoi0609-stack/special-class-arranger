
export type SchoolLevel = 'ELEMENTARY_MIDDLE' | 'HIGH';

export interface TagDefinition {
  id: string;
  label: string;
  colorBg: string; // Tailwind class e.g., 'bg-red-100'
  colorText: string; // Tailwind class e.g., 'text-red-800'
}

export interface Student {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  tagIds: string[];
  assignedClassId: string | null; // null means 'Unassigned'
}

export interface SeparationRule {
  id: string;
  studentIds: string[];
}

export interface AppState {
  schoolLevel: SchoolLevel;
  classCount: number;
  students: Student[];
  tags: TagDefinition[];
  separationRules: SeparationRule[];
}

// AI Analysis Types
export interface ClassAnalysisData {
  classId: string;
  riskScore: number; // 0-100 (Higher is riskier)
  balanceScore: number; // 0-100 (Higher is better)
  comment: string;
}

export interface AiAnalysisResult {
  overallScore: number;
  overallComment: string;
  classes: ClassAnalysisData[];
  recommendations: string[];
}
