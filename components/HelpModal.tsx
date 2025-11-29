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
        <div className="overflow-y-auto p-6 space-y-6 text-gray-700">
          
          {/* Section 1: 기본 사용 순서 */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-indigo-700 text-lg mb-4">
              <ClipboardList size={20} />
              기본 사용 순서 
            </h3>
            <div className="space-y-5 pl-1">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">1</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">설정 및 학생 등록</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    좌측 설정 메뉴에서 <strong>학교급(정원)</strong> 및 <strong>학급 수</strong>를 설정합니다.<br/>
                    '미배정 학생' 구역의 <span className="inline-block bg-gray-200 px-1.5 py-0.5 rounded text-xs font-bold text-gray-700 mx-1">+</span> 버튼을 통해 학생 성명과 특성(Tag)을 등록합니다.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">2</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">반 배정 (Drag & Drop)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    학생 카드를 마우스로 드래그하여 원하는 반으로 이동시킵니다.<br/>
                    정원 초과 또는 분리 배정 규칙 위반 시, 해당 반의 테두리가 <span className="font-bold text-red-600">붉은색</span>으로 표시되어 즉시 확인이 가능합니다.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">3</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">분석 및 결과 저장</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>AI 분석</strong> 기능을 통해 반별 균형 및 특성 분포에 대한 전문적인 피드백을 확인할 수 있습니다.(1분 가량 소요)<br/>
                    편성이 완료되면 <strong>Excel 저장</strong> 버튼을 사용하여 결과 보고서를 다운로드합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-200 my-2" />

          {/* Section 2: 주요 기능 활용 */}
          <section>
            <h3 className="flex items-center gap-2 font-bold text-amber-600 text-lg mb-3">
              <Lightbulb size={20} />
              주요 기능 활용
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed marker:text-amber-400">
              <li>
                <strong className="text-gray-900">분리 배정 관리:</strong> 특정 학생들을 분리해야 할 경우, 좌측 '분리 배정 그룹' 기능을 활용하여 사전에 규칙을 설정할 수 있습니다.
              </li>
              <li>
                <strong className="text-gray-900">프로젝트 백업:</strong> 작업 중단 시 <strong>프로젝트 저장</strong> 기능을 통해 현재 상태를 파일로 백업하고, 추후 불러오기를 통해 작업을 재개할 수 있습니다.
              </li>
              <li>
                <strong className="text-gray-900">샘플 데이터:</strong> 앱 사용이 처음이라면 '샘플 데이터 자동입력'을 눌러 기능을 체험해 보세요.
              </li>
              <li>
                 <strong className="text-gray-900">데이터 초기화:</strong> 설정 메뉴 하단의 '데이터 초기화'를 선택하면 추가된 태그 및 학생 카드가 전부 삭제됩니다.
              </li>
            </ul>
          </section>

          {/* Section 3: 보안 */}
          <div className="bg-green-50 p-5 rounded-xl border border-green-100">
            <h3 className="flex items-center gap-2 font-bold text-green-800 text-lg mb-2">
              <ShieldCheck size={20} />
              보안 및 개인정보 보호
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-green-900/80 leading-relaxed marker:text-green-600">
              <li>모든 데이터는 사용자의 <strong>PC(브라우저)에만 저장</strong>되며, 외부 서버로 전송되지 않습니다.</li>
              <li>AI 분석 요청 시, 학생의 성명은 <strong className="text-green-800 underline decoration-green-300 decoration-2 underline-offset-2">자동 마스킹 처리(예: 홍○동)</strong>되어 전송됩니다.</li>
            </ul>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};