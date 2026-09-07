'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_SEASONINGS, setStoredSeasonings, getStoredSeasonings, setStoredNickname } from '@/lib/store';

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const stored = getStoredSeasonings();
    if (stored !== null && stored.length > 0) {
      router.replace('/');
    }
  }, [router]);

  const toggleSeasoning = (name: string) => {
    setSelected(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const selectBasic5 = () => {
    const basic5 = ['진간장', '설탕', '소금', '식용유', '다진마늘'];
    setSelected(Array.from(new Set([...selected, ...basic5])));
  };

  const selectAll = () => {
    setSelected([...DEFAULT_SEASONINGS]);
  };

  const handleSave = () => {
    if (!nickname.trim()) {
      alert('셰프님의 닉네임을 입력해주세요!');
      return;
    }
    setStoredNickname(nickname.trim());
    setStoredSeasonings(selected);
    router.replace('/');
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-white">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">냉파셰프 환영합니다!</h1>
        <p className="text-gray-600 mb-6">사용하실 닉네임과 기본 조미료를 설정해주세요.</p>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">셰프 닉네임</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 지구방위대"
            maxLength={10}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
          />
        </div>
        
        <div className="flex gap-2 mb-6">
          <button 
            onClick={selectBasic5}
            className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold"
          >
            기본 5종 빠른 선택
          </button>
          <button 
            onClick={selectAll}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold"
          >
            전체 선택
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DEFAULT_SEASONINGS.map(item => (
            <div 
              key={item} 
              onClick={() => toggleSeasoning(item)}
              className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-colors ${
                selected.includes(item) 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200'
              }`}
            >
              <span className={`font-medium ${selected.includes(item) ? 'text-orange-700' : 'text-gray-700'}`}>
                {item}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected.includes(item) ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {selected.includes(item) && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 mt-6 bg-orange-500 text-white rounded-xl font-bold text-lg shadow-lg"
      >
        설정 완료
      </button>
    </div>
  );
}
