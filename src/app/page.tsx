'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Camera, Image as ImageIcon, Send, Loader2, X, History, Refrigerator, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { App as CapApp } from '@capacitor/app';
import { AdMob, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { 
  getStoredSeasonings, 
  getDailyUsage, 
  decrementDailyUsage, 
  rewardAdCharge, 
  getRecipeHistory, 
  addRecipeHistory,
  getStoredPantry,
  addPantryItems,
  setStoredPantry
} from '@/lib/store';
import AdBanner from '@/components/AdBanner';
import RecipeModal, { Recipe } from '@/components/RecipeModal';
import Receipt from '@/components/Receipt';

export default function Home() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [seasonings, setSeasonings] = useState<string[]>([]);
  const [dailyUsage, setDailyUsageState] = useState({ date: '', count: 5 });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [extraText, setExtraText] = useState('');
  
  // v1.1 New states: Servings, Filters, Pantry
  const [servings, setServings] = useState('1인분');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [pantry, setPantry] = useState<string[]>([]);
  const [newPantryInput, setNewPantryInput] = useState('');
  const [showPantrySection, setShowPantrySection] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const [showSplash, setShowSplash] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isLivePhoto, setIsLivePhoto] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const [showPreAd, setShowPreAd] = useState(false);
  const [recipeToView, setRecipeToView] = useState<Recipe | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const TIPS = [
    "냉파 꿀팁: 남은 치킨은 잘게 찢어 볶음밥에 넣으면 훌륭해요!",
    "냉파 꿀팁: 시들해진 파는 송송 썰어 냉동 보관하세요.",
    "냉파 꿀팁: 양파 껍질은 버리지 말고 육수 낼 때 사용해보세요.",
    "냉파셰프가 냉장고 안을 샅샅이 뒤지고 있습니다..."
  ];

  useEffect(() => {
    // Hide splash after 1.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    const stored = getStoredSeasonings();
    if (!stored || stored.length === 0) {
      router.replace('/onboarding');
    } else {
      setSeasonings(stored);
      setDailyUsageState(getDailyUsage());
      setHistoryItems(getRecipeHistory());
      setPantry(getStoredPantry());
    }
    setIsReady(true);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      if (showPreAd) {
        setShowPreAd(false);
      } else if (showHistory) {
        setShowHistory(false);
      } else if (showReceipt) {
        setShowReceipt(false);
      } else if (selectedRecipe) {
        setSelectedRecipe(null);
      } else if (recipes) {
        setRecipes(null);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(listener => listener.remove());
    };
  }, [showPreAd, showHistory, showReceipt, selectedRecipe, recipes]);

  const handleTakeAction = async (source: CameraSource) => {
    if (photos.length >= 3) {
      alert('사진은 최대 3장까지만 올릴 수 있습니다.');
      return;
    }

    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 1024
      });
      if (image.dataUrl) {
        setPhotos(prev => [...prev, image.dataUrl!]);
        if (source === CameraSource.Camera) {
          setIsLivePhoto(true);
        }
      }
    } catch (e) {
      console.error('User cancelled or error', e);
    }
  };

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleRecipeClick = (recipe: Recipe) => {
    if (Capacitor.getPlatform() === 'web') {
      setSelectedRecipe(recipe);
      return;
    }
    setRecipeToView(recipe);
    setShowPreAd(true);
  };

  const showAdAndRecipe = async () => {
    setShowPreAd(false);
    if (!recipeToView) return;

    try {
      const options: AdOptions = {
        adId: Capacitor.getPlatform() === 'ios' ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712',
        isTesting: true
      };
      
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      
      setSelectedRecipe(recipeToView);
    } catch (err) {
      console.error('AdMob Error', err);
      setSelectedRecipe(recipeToView);
    } finally {
      setRecipeToView(null);
    }
  };

  const toggleFilter = (filterName: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterName) 
        ? prev.filter(f => f !== filterName) 
        : [...prev, filterName]
    );
  };

  const handleAddManualPantry = () => {
    if (!newPantryInput.trim()) return;
    const items = newPantryInput.split(',').map(s => s.trim()).filter(Boolean);
    addPantryItems(items);
    setPantry(getStoredPantry());
    setNewPantryInput('');
  };

  const handleRemovePantryItem = (itemToRemove: string) => {
    const updated = pantry.filter(i => i !== itemToRemove);
    setStoredPantry(updated);
    setPantry(updated);
  };

  const submitRecipeRequest = async () => {
    if (photos.length === 0 && !extraText.trim() && pantry.length === 0) {
      alert('재료 사진을 올리거나 냉장고 보관 재료를 추가해주세요.');
      return;
    }

    if (dailyUsage.count <= 0) {
      const confirmAd = window.confirm('오늘 횟수를 모두 사용했습니다. 짧은 광고를 보고 5회 전체 충전하시겠습니까?');
      if (confirmAd) {
        // Simulate viewing an ad for recharge
        setTimeout(() => {
          rewardAdCharge();
          setDailyUsageState(getDailyUsage());
          alert('5회 충전되었습니다!');
        }, 2000);
      }
      return;
    }

    setIsLoading(true);
    setTipIndex(0);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/recipe` 
        : '/api/recipe';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagesBase64: photos,
          extraText,
          defaultSeasonings: seasonings,
          servings,
          filters: selectedFilters,
          pantryIngredients: pantry
        })
      });

      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      if (!res.ok) throw new Error('서버 오류가 발생했습니다.');
      
      // Auto-add newly detected ingredients to pantry
      if (data.detectedIngredients && data.detectedIngredients.length > 0) {
        addPantryItems(data.detectedIngredients);
        setPantry(getStoredPantry());
      }

      // Decrease count
      decrementDailyUsage();
      setDailyUsageState(getDailyUsage());
      
      const newRecipes = data.recipes.map((r: any) => ({
        ...r,
        servings,
        eventCode: isLivePhoto ? `LIVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined
      }));

      setRecipes(newRecipes);
      
      // Save to history
      newRecipes.forEach((r: any) => addRecipeHistory(r));
      setHistoryItems(getRecipeHistory());

      setPhotos([]);
      setExtraText('');
      setIsLivePhoto(false);
      
    } catch (e: any) {
      alert('오류가 발생했습니다: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-[50px] relative">
      
      {/* Smooth Splash Overlay */}
      {showSplash && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white transition-opacity duration-300"
          style={{ backgroundColor: '#f97316' }}
        >
          <div 
            className="mb-4 bg-white p-2 shadow-2xl flex items-center justify-center animate-bounce"
            style={{ width: '120px', height: '120px', borderRadius: '9999px', overflow: 'hidden' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpg" 
              alt="Naengpa Chef Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9999px' }} 
            />
          </div>
          <h1 className="text-3xl font-black mb-1 tracking-tight text-white">냉파셰프</h1>
          <p className="text-sm font-medium text-orange-100">냉장고 파먹기의 달인</p>
        </div>
      )}
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10 sticky top-0">
        <h1 className="text-xl font-black text-orange-500">냉파셰프</h1>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
            남은 횟수 {dailyUsage.count}/5
          </div>
          <button onClick={() => setShowHistory(true)} className="text-gray-500 p-1">
            <History size={20} />
          </button>
          <button onClick={() => router.push('/onboarding')} className="text-gray-500 p-1">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Event Banner */}
      <div 
        onClick={() => window.open('https://forms.gle/dummy', '_blank')}
        className="mx-4 mt-4 p-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl shadow cursor-pointer active:scale-95 transition-transform"
      >
        <p className="font-bold">🎉 직접 만든 요리 인증하면 밀키트 선물!</p>
        <p className="text-xs opacity-90 mt-1">이번 주 당첨 확률 UP! (터치하여 참여)</p>
      </div>

      <main className="flex-1 p-4 flex flex-col gap-6">
        {recipes ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-lg font-black text-gray-900">추천 레시피 3종</h2>
                <p className="text-xs text-gray-500 font-medium">{servings} 맞춤 황금 레시피</p>
              </div>
              <button onClick={() => setRecipes(null)} className="text-xs text-orange-600 font-bold underline">
                다른 조건으로 다시하기
              </button>
            </div>
            {recipes.map((recipe, idx) => (
              <div 
                key={idx} 
                onClick={() => handleRecipeClick(recipe)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                      {recipe.category}
                    </span>
                    {recipe.estimatedCalories && (
                      <span className="text-xs font-medium text-gray-400">
                        🔥 {recipe.estimatedCalories}kcal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">⏱ {recipe.time}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-1">{recipe.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{recipe.description}</p>
                {recipe.upgradeTip && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-purple-700 font-semibold bg-purple-50/60 px-2 py-1 rounded-md">
                    <span>✨ 컬리 꿀조합: {recipe.upgradeTip.ingredient}</span>
                    <span className="text-[10px] text-purple-500 underline">상세보기</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 내 냉장고 재료함 (Pantry Box) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Refrigerator className="text-orange-500" size={18} />
                  <h3 className="font-bold text-gray-800 text-sm">내 냉장고 보관 재료</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                    {pantry.length}개
                  </span>
                </div>
                <button 
                  onClick={() => setShowPantrySection(!showPantrySection)}
                  className="text-xs text-gray-400 font-medium"
                >
                  {showPantrySection ? '접기' : '펼치기'}
                </button>
              </div>

              {showPantrySection && (
                <div className="space-y-3 pt-1">
                  {pantry.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {pantry.map((item, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg"
                        >
                          {item}
                          <button 
                            onClick={() => handleRemovePantryItem(item)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">
                      냉장고가 비어있어요. 사진을 찍으면 자동으로 채워집니다!
                    </p>
                  )}

                  {/* Manual Add Input */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newPantryInput}
                      onChange={(e) => setNewPantryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddManualPantry()}
                      placeholder="재료 직접 추가 (쉼표로 구분: 두부, 계란)"
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-400"
                    />
                    <button 
                      onClick={handleAddManualPantry}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={14} />
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Input Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800 text-center text-sm">새로운 재료 사진 찍기 / 추가</h2>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleTakeAction(CameraSource.Camera)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 p-3.5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 active:bg-gray-100 transition"
                >
                  <Camera className="text-gray-400" size={22} />
                  <span className="text-xs text-gray-700 font-bold">사진 촬영</span>
                </button>
                <button 
                  onClick={() => handleTakeAction(CameraSource.Photos)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 p-3.5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 active:bg-gray-100 transition"
                >
                  <ImageIcon className="text-gray-400" size={22} />
                  <span className="text-xs text-gray-700 font-bold">앨범 선택</span>
                </button>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden bg-black w-20 h-20 flex-shrink-0 snap-center shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Ingredient ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea 
                value={extraText}
                onChange={(e) => setExtraText(e.target.value)}
                placeholder="추가로 더 있는 재료나 양념을 적어주세요."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-300 resize-none"
                rows={2}
              />

              {/* Servings Selector (인원수 선택) */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-2">🍽️ 요리 인원수</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1인분', '2인분', '3~4인분'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setServings(s)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        servings === s
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-100 scale-[1.02]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Chips (상황별 맞춤 필터) */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-gray-700 mb-2">✨ 맞춤 조리 조건 (다중 선택)</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '👶 아이용(안 맵게)',
                    '🥗 다이어트(저칼로리)',
                    '⚡ 전자레인지 전용',
                    '🔥 에어프라이어'
                  ].map((filter) => {
                    const isSelected = selectedFilters.includes(filter);
                    return (
                      <button
                        key={filter}
                        onClick={() => toggleFilter(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-orange-100 text-orange-700 border border-orange-300 font-bold' 
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={submitRecipeRequest}
                disabled={isLoading || (photos.length === 0 && !extraText.trim() && pantry.length === 0)}
                className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-lg shadow-orange-100"
              >
                {isLoading ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>냉파셰프가 고민중...</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">{TIPS[tipIndex]}</span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send size={18} />
                    <span>{servings} 맞춤 요리 추천받기</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pre-Ad Modal */}
      {showPreAd && recipeToView && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
              <span className="text-3xl">🎁</span>
            </div>
            <h2 className="text-xl font-bold mb-2">시크릿 레시피 발견!</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              광고 시청 후 레시피 상세 정보가 공개됩니다.<br/>
              <span className="text-orange-500 font-bold">(광고 시청은 앱 운영에 큰 도움이 됩니다 ❤️)</span>
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setShowPreAd(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
              >
                닫기
              </button>
              <button 
                onClick={showAdAndRecipe}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200"
              >
                광고 보고 열기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedRecipe && !showReceipt && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
          onCookDone={() => {
            setShowReceipt(true);
            setPantry(getStoredPantry());
          }}
        />
      )}

      {showReceipt && selectedRecipe && (
        <Receipt 
          recipeTitle={selectedRecipe.title}
          savings={selectedRecipe.estimatedSavings}
          eventCode={selectedRecipe.eventCode}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">요리 추천 기록</h2>
            <button onClick={() => setShowHistory(false)} className="p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
            {historyItems.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">기록이 없습니다.</p>
            ) : (
              historyItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    handleRecipeClick(item);
                    setShowHistory(false);
                  }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-orange-500">{item.category}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  {item.eventCode && <span className="text-[10px] text-blue-500 font-bold">✓ Live Verified</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Fixed Ad Banner at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white">
        {/* iOS Home Indicator padding will be handled by globals.css safe-area in root, but ad itself needs space */}
        <AdBanner />
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </div>
    </div>
  );
}
