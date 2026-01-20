
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CompanyInfo, BusinessPlanData } from './types';
import { generateBusinessPlan, generateImages } from './services/geminiService';
import BusinessPlanForm from './components/BusinessPlanForm';
import BusinessPlanView from './components/BusinessPlanView';
import ApiKeyModal from './components/ApiKeyModal';

declare const html2pdf: any;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState<BusinessPlanData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);

    // 외부 클릭 시 도움말 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = async (info: CompanyInfo) => {
    const activeKey = userApiKey || process.env.API_KEY;
    
    if (!activeKey || activeKey === "undefined") {
      alert("API 키 설정이 필요합니다.");
      setIsApiModalOpen(true);
      return;
    }

    setIsLoading(true);
    setPlanData(null);
    setImages([]);
    
    try {
      const [data, imgs] = await Promise.all([
        generateBusinessPlan(info, activeKey),
        generateImages(info, activeKey)
      ]);
      
      if (data) {
        setPlanData(data);
        setImages(imgs);
        setShowResult(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      alert(`생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetKey = () => {
    if (window.confirm("API 엔진 연결을 해제하고 저장된 키를 삭제하시겠습니까?")) {
      localStorage.removeItem('gemini_api_key');
      setUserApiKey(null);
      alert("연결이 해제되었습니다.");
    }
  };

  const handleDownloadPDF = useCallback(() => {
    if (!planData) return;
    const element = document.getElementById('plan-container');
    const fileName = planData.summary.introduction.split(' ')[0] || 'BusinessPlan';
    const opt = {
      margin: 10,
      filename: `SS연구소_사업계획서_${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }, [planData]);

  const hasActiveKey = !!(userApiKey || (process.env.API_KEY && process.env.API_KEY !== "undefined"));

  if (showResult && planData) {
    return (
      <div className="min-h-screen bg-slate-900 py-10">
        <div className="max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center no-print">
          <button 
            type="button"
            onClick={() => setShowResult(false)} 
            className="flex items-center text-white hover:text-blue-400 font-bold group bg-transparent border-none cursor-pointer"
          >
            <svg className="w-6 h-6 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            수정하러 돌아가기
          </button>
          <button 
            type="button"
            onClick={handleDownloadPDF} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center active:scale-95 transition-all"
          >
            PDF 다운로드
          </button>
        </div>
        <BusinessPlanView data={planData} images={images} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-['Noto_Sans_KR']">
      <nav className="bg-white border-b border-slate-200 py-4 px-6 mb-8 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-inner">SS</div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-800 leading-tight">SS창업경영연구소</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">PSST Builder Deep v2.0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 도움말 아이콘 및 팝오버 */}
            <div className="relative" ref={helpRef}>
              <button 
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm ${isHelpOpen ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'}`}
                title="API 키 발급 안내"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {isHelpOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Gemini API 키 발급 가이드
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-4 font-medium">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">1</span>
                      <p><a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Google AI Studio</a>에 접속하여 구글 계정으로 로그인합니다.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">2</span>
                      <p>좌측 상단의 <span className="text-slate-800 font-bold">"Get API key"</span> 메뉴를 클릭합니다.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">3</span>
                      <p><span className="text-slate-800 font-bold">"Create API key"</span> 버튼을 눌러 새로운 키를 생성합니다.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">4</span>
                      <p>생성된 키를 복사하여 본 서비스의 <span className="text-slate-800 font-bold">API 설정</span> 창에 입력하세요.</p>
                    </li>
                  </ol>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">※ 무료 티어의 경우 분당 요청 횟수 제한이 있을 수 있습니다.</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsApiModalOpen(true)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-sm"
              title="API 설정"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button 
              onClick={handleResetKey}
              className={`flex items-center text-[11px] sm:text-xs px-3 sm:px-4 py-2 rounded-full font-bold border transition-all active:scale-95 hover:opacity-80 shadow-sm ${
                hasActiveKey
                ? 'bg-green-50 text-green-700 border-green-100 cursor-pointer' 
                : 'bg-red-50 text-red-700 border-red-100'
              }`}
              title={hasActiveKey ? "클릭 시 연결 해제" : "연결이 필요합니다"}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                hasActiveKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              }`}></div>
              {hasActiveKey ? 'AI 엔진 가동 중' : 'API 키 필요'}
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4">
        <BusinessPlanForm onSubmit={handleGenerate} isLoading={isLoading} />
        
        {!isLoading && (
          <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">심층 리서치 엔진</h3>
              <p className="text-slate-500 text-sm">최신 데이터를 기반으로 대용량 계획서를 구성합니다.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">첨부파일 분석</h3>
              <p className="text-slate-500 text-sm">업로드된 파일을 AI가 분석하여 내용에 반영합니다.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2.01 2.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-800">시각 자료 생성</h3>
              <p className="text-slate-500 text-sm">사업 아이템을 실사 수준의 이미지로 렌더링합니다.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-16 bg-white text-center border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-800 font-extrabold text-xl mb-1">SS창업경영연구소</p>
          <p className="text-slate-500 text-sm mb-10 font-medium">(주)소셜위즈 - SocialWiz Inc. Partnership</p>
          <div className="flex justify-center items-center gap-6 text-xs text-blue-600 font-semibold">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:underline">Billing 안내</a>
          </div>
        </div>
      </footer>

      <ApiKeyModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
        onSave={(key) => setUserApiKey(key)}
      />
    </div>
  );
};

export default App;
