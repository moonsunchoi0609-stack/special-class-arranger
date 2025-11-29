import { TagDefinition, SchoolLevel } from './types';

export const INITIAL_TAGS: TagDefinition[] = [
  // 1. 공격성
  { id: 't3', label: '공격성', colorBg: 'bg-red-100', colorText: 'text-red-800' },
  // 2. 휠체어
  { id: 't2', label: '휠체어', colorBg: 'bg-blue-100', colorText: 'text-blue-800' },
  // 3. 기저귀
  { id: 't1', label: '기저귀', colorBg: 'bg-orange-100', colorText: 'text-orange-800' },
  // 4. 분쇄식 (구 식사지원)
  { id: 't8', label: '분쇄식', colorBg: 'bg-yellow-100', colorText: 'text-yellow-800' },
  // 5. 화장실지원 (구 신변지원)
  { id: 't9', label: '화장실지원', colorBg: 'bg-indigo-100', colorText: 'text-indigo-800' },
  // 6. 보행지원 (구 이동지원)
  { id: 't10', label: '보행지원', colorBg: 'bg-teal-100', colorText: 'text-teal-800' },
  // 7. 교사보조가능 (구 인지상위)
  { id: 't5', label: '교사보조가능', colorBg: 'bg-green-100', colorText: 'text-green-800' },
  // 8. 학부모예민
  { id: 't6', label: '학부모예민', colorBg: 'bg-purple-100', colorText: 'text-purple-800' },
  // 9. 잦은결석
  { id: 't4', label: '잦은결석', colorBg: 'bg-gray-100', colorText: 'text-gray-800' },
  // 10. 베드사용
  { id: 't7', label: '베드사용', colorBg: 'bg-pink-100', colorText: 'text-pink-800' },
];

export const TAG_COLORS = [
  { bg: 'bg-slate-100', text: 'text-slate-800' },
  { bg: 'bg-gray-100', text: 'text-gray-800' },
  { bg: 'bg-zinc-100', text: 'text-zinc-800' },
  { bg: 'bg-neutral-100', text: 'text-neutral-800' },
  { bg: 'bg-stone-100', text: 'text-stone-800' },
  { bg: 'bg-red-100', text: 'text-red-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { bg: 'bg-lime-100', text: 'text-lime-800' },
  { bg: 'bg-green-100', text: 'text-green-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  { bg: 'bg-pink-100', text: 'text-pink-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800' },
];

export const MAX_CAPACITY = {
  ELEMENTARY_MIDDLE: 6,
  HIGH: 7,
};

export const UNASSIGNED_ID = 'unassigned';