'use client';

import { X, Clock, Flame, CheckCircle, ExternalLink, ShoppingBag } from 'lucide-react';
import { removePantryItems } from '@/lib/store';
import { useState } from 'react';

export interface Recipe {
  category: string;
  title: string;
  time: string;
  servings?: string;
  difficulty: string;
  estimatedCalories?: number;
  description: string;
  usedIngredients: string[];
  remainingIngredients?: string[];
  seasoningRatio: { name: string; spoon: string }[];
  substituteTips: string;
  steps: string[];
  estimatedSavings: number;
  eventCode?: string;
  upgradeTip?: {
    ingredient: string;
    description: string;
    kurlySearchKeyword: string;
  };
}

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onCookDone: () => void;
}

export default function RecipeModal({ recipe, onClose, onCookDone }: RecipeModalProps) {
  const [deducted, setDeducted] = useState(false);

  const handleFinishCooking = () => {
    if (recipe.usedIngredients && recipe.usedIngredients.length > 0) {
      removePantryItems(recipe.usedIngredients);
    }
    setDeducted(true);
    setTimeout(() => {
      onCookDone();
    }, 600);
  };

  const openKurlySearch = (keyword: string) => {
    const url = `https://www.kurly.com/search?sword=${encodeURIComponent(keyword)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                {recipe.category}
              </span>
              {recipe.servings && (
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                  {recipe.servings} 기준
                </span>
              )}
              {recipe.estimatedCalories && (
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md flex items-center gap-0.5">
                  <Flame size={12} />
                  {recipe.estimatedCalories} kcal
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{recipe.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-gray-800">
          
          {/* Time & Difficulty */}
          <div className="flex gap-4 p-3 bg-gray-50 rounded-xl text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <Clock size={16} className="text-orange-500" />
              <span>조리시간: {recipe.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <Flame size={16} className="text-orange-500" />
              <span>난이도: {recipe.difficulty}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/80">
            💡 {recipe.description}
          </p>

          {/* Ingredients */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
              🥕 사용된 냉장고 재료
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {recipe.usedIngredients.map((item, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Seasoning Ratio */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
              🥄 황금 양념 비율 ({recipe.servings || '1인분'} 기준)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {recipe.seasoningRatio.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-orange-50/60 rounded-xl text-xs border border-orange-100">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className="font-bold text-orange-600">{item.spoon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Tip for Kurly/Coupang M&A Vision */}
          {recipe.upgradeTip && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-700 flex items-center gap-1">
                  <ShoppingBag size={14} />
                  컬리 꿀조합 +1 추천 재료
                </span>
                <button 
                  onClick={() => openKurlySearch(recipe.upgradeTip!.kurlySearchKeyword)}
                  className="text-[11px] text-purple-600 font-bold flex items-center gap-0.5 hover:underline"
                >
                  컬리에서 보기 <ExternalLink size={11} />
                </button>
              </div>
              <p className="text-xs text-purple-900 font-medium leading-relaxed">
                ✨ <strong className="text-purple-700">[{recipe.upgradeTip.ingredient}]</strong> {recipe.upgradeTip.description}
              </p>
            </div>
          )}

          {/* Steps */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2.5 flex items-center gap-1.5 text-sm">
              🍳 조리 순서
            </h3>
            <ol className="space-y-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-orange-500 flex-shrink-0">{i + 1}.</span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Substitute Tips */}
          {recipe.substituteTips && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800">
              <span className="font-bold">🔄 대체 팁: </span>{recipe.substituteTips}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white space-y-2">
          <button 
            onClick={handleFinishCooking}
            disabled={deducted}
            className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 active:scale-[0.98] transition shadow-lg shadow-orange-100 disabled:bg-emerald-500"
          >
            {deducted ? (
              <>
                <CheckCircle size={18} />
                <span>재료 차감 완료! 영수증 발행 중...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>요리 완료 & 절약 영수증 받기</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
