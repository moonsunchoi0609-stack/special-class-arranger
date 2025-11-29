import React from 'react';
import { X, ClipboardList, Lightbulb, ShieldCheck, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-200" />
            사용 가이드
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-indigo-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4 text-gray-700">
          
          {/* Section 1 */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-indigo-700 text-lg mb-3">
              <ClipboardList size={20} />
              사용 순서 
            </h3>
            <div className="space-y-4 pl-1">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h4 className="font-bold text-gray-800">설정 및 학생 등록</h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    좌측 설정 메뉴에서 학교급(정원) 및 학급 수를 설정합니다.<br/>
                    '미배정 학생' 구역의 <span className="inline-block bg-gray-200 px-1 rounded text-xs">+</span> 버튼을 통해 학생 성명과 특성(Tag)을 등록합니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h4 className="font-bold text-gray-800">반 배정 (Drag & Drop)</h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    학생 카드를 마우스로 드래그하여 원하는 반으로 이동시킵니다.<br/>
                    <span className="font-medium text-red-500">배정 경고:</span> 정원 초과 또는 분리 배정 규칙 위반 시, 해당 반의 테두리가 붉은색으로 표시되어 즉시 확인이 가능합니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h4 className="font-bold text-gray-800">분석 및 결과 저장</h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    상단 AI 분석 기능을 통해 반별 균형 및 특성 분포에 대한 전문적인 피드백을 확인할 수 있습니다.<br/>
                    편성이 완료되면 Excel 저장 버튼을 사용하여 결과 보고서를 다운로드합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section 2 */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-amber-600 text-lg mb-3">
              <Lightbulb size={20} />
              주요 기능 활용
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed marker:text-amber-400">
              <li>
                <strong className="text-gray-800">분리 배정 관리:</strong> 특정 학생들을 분리해야 할 경우, 좌측 '분리 배정 그룹' 기능을 활용하여 사전에 규칙을 설정할 수 있습니다.
              </li>
              <li>
                <strong className="text-gray-800">프로젝트 백업:</strong> 작업 중단 시 프로젝트 저장 기능을 통해 현재 상태를 파일로 백업하고, 추후 불러오기를 통해 작업을 재개할 수 있습니다.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="flex items-center gap-2 font-bold text-green-700 text-lg mb-2">
              <ShieldCheck size={20} />
              보안 및 개인정보 보호
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 leading-relaxed marker:text-green-500">
              <li>모든 데이터는 사용자의 PC(브라우저)에만 저장되며, 외부 서버로 전송되지 않습니다.</li>
              <li>AI 분석 요청 시, 학생의 성명은 <strong className="text-gray-800">자동 마스킹 처리(예: 홍○동)</strong>되어 전송됩니다.</li>
            </ul>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
