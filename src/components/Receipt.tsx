'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';

import { getStoredNickname } from '@/lib/store';

interface ReceiptProps {
  recipeTitle: string;
  savings: number;
  eventCode?: string;
  onClose: () => void;
}

export default function Receipt({ recipeTitle, savings, eventCode, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nickname, setNickname] = useState('지구방위대');

  useEffect(() => {
    setNickname(getStoredNickname());
  }, []);

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsProcessing(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#f3f4f6', scale: 2 });
      const base64Data = canvas.toDataURL('image/jpeg');

      // Native Share if available
      try {
        await Share.share({
          title: '냉파셰프 절약 영수증',
          text: `오늘 ${recipeTitle} 요리로 배달비 ${savings.toLocaleString()}원을 절약했어요!`,
          url: 'https://naengpa-chef.app',
          dialogTitle: '절약 영수증 공유하기',
        });
      } catch (err) {
        console.warn('Native share failed or not available, fallback to download', err);
        const a = document.createElement('a');
        a.href = base64Data;
        a.download = 'naengpa_receipt.jpg';
        a.click();
      }
    } catch (e) {
      console.error('Failed to capture receipt', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6 flex-col backdrop-blur-sm">
      <div className="w-full max-w-sm flex justify-end mb-4">
        <button onClick={onClose} className="text-white bg-white/20 rounded-full p-2 hover:bg-white/40 transition"><X size={24} /></button>
      </div>

      <div 
        ref={receiptRef}
        className="w-full max-w-sm bg-[#f8f8f8] px-6 pt-8 pb-12 relative overflow-hidden"
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          maskImage: 'radial-gradient(circle at 10px 0, transparent 10px, black 11px), radial-gradient(circle at 10px 100%, transparent 10px, black 11px)',
          maskSize: '100% 20px',
          maskRepeat: 'repeat-x',
          maskPosition: 'top, bottom'
        }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/crumpled-paper.png")' }}></div>
        
        <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6 relative z-10">
          <h2 className="text-3xl font-black mb-2 font-mono tracking-tighter text-gray-800">NAENGPA CHEF</h2>
          <p className="text-xs text-gray-500 font-mono">Receipt No. {new Date().getTime().toString().slice(-8)}</p>
          <p className="text-xs text-gray-500 font-mono mt-1">{new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-4 mb-6 text-sm font-mono relative z-10 text-gray-700">
          <div className="flex justify-between items-center">
            <span className="font-bold">셰프</span>
            <span className="text-lg">{nickname}</span>
          </div>
          {eventCode && (
            <div className="flex justify-between items-center text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
              <span className="font-bold">✓ 라이브 인증</span>
              <span className="font-bold">{eventCode}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-bold text-xl border-y-2 border-dashed border-gray-300 py-4 mt-2 text-gray-900">
            <span>메뉴</span>
            <span className="text-right ml-4 break-words">{recipeTitle}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm font-mono mb-8 relative z-10 text-gray-700">
          <div className="flex justify-between items-center opacity-60">
            <span>예상 배달비용</span>
            <span className="line-through">{savings.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-end text-orange-600 border-t-2 border-dashed border-gray-300 pt-4 mt-2">
            <span className="font-bold">절약 금액</span>
            <span className="text-3xl font-black tracking-tight">{savings.toLocaleString()}원</span>
          </div>
        </div>

        <div className="flex flex-col items-center mt-8 relative z-10">
          {/* Fake Barcode */}
          <div className="flex gap-[2px] h-12 w-full justify-center opacity-70 mb-4">
            {Array.from({length: 30}).map((_, i) => (
              <div key={i} style={{ width: Math.random() * 4 + 1 + 'px', backgroundColor: '#333' }}></div>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-mono text-center">오늘도 냉장고 파먹기 성공!<br/>탄소 배출 절감에 동참해주셔서 감사합니다.</p>
        </div>
      </div>

      <button 
        onClick={handleShare}
        disabled={isProcessing}
        className="mt-8 px-8 py-3 bg-white text-gray-900 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
      >
        <Share2 size={20} />
        {isProcessing ? '영수증 굽는 중...' : '영수증 자랑하기'}
      </button>
    </div>
  );
}
