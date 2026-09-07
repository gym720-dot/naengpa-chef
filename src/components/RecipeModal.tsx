'use client';

import { X } from 'lucide-react';

export type Recipe = {
  category: string;
  title: string;
  time: string;
  difficulty: string;
  description: string;
  usedIngredients: string[];
  seasoningRatio: { name: string; spoon: string }[];
  substituteTips: string;
  steps: string[];
  estimatedSavings: number;
  eventCode?: string;
};

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onShowReceipt: () => void;
}

export default function RecipeModal({ recipe, onClose, onShowReceipt }: RecipeModalProps) {
  const handleEventForm = () => {
    // Open Google Form
    window.open('https://forms.gle/dummy-form-link', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">{recipe.title}</h2>
        <button onClick={onClose} className="p-2"><X size={24} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mb-6">
          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold mb-2">
            {recipe.category}
          </span>
          <p className="text-gray-600">{recipe.description}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>⏱ {recipe.time}</span>
            <span>⭐ {recipe.difficulty}</span>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-xl">
          <h3 className="font-bold mb-2 flex items-center gap-2">🥄 황금 양념 비율</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {recipe.seasoningRatio.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b pb-1">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium">{item.spoon}</span>
              </li>
            ))}
          </ul>
        </div>

        {recipe.substituteTips && (
          <div className="mb-6 bg-blue-50 p-4 rounded-xl text-sm">
            <p className="font-bold text-blue-800 mb-1">💡 없는 재료 대체 팁</p>
            <p className="text-blue-700">{recipe.substituteTips}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold mb-3">🍳 조리 순서</h3>
          <ol className="space-y-4">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex flex-col gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onShowReceipt}
          className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          🧾 요리 완성! 절약 영수증 보기
        </button>
        <button 
          onClick={handleEventForm}
          className="w-full py-3 bg-orange-100 text-orange-600 rounded-xl font-bold"
        >
          🎁 요리 인증하고 밀키트 응모하기
        </button>
      </div>
    </div>
  );
}
