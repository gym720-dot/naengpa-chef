'use client';

// 로컬 스토리지 키 관리
export const STORAGE_KEYS = {
  SEASONINGS: 'naengpa_seasonings',
  DAILY_USAGE: 'naengpa_daily_usage', // { date: 'YYYY-MM-DD', count: number }
  RECIPE_HISTORY: 'naengpa_recipe_history', // Recipe[]
  NICKNAME: 'naengpa_nickname',
};

export const getStoredNickname = () => {
  if (typeof window === 'undefined') return '지구방위대';
  return localStorage.getItem(STORAGE_KEYS.NICKNAME) || '지구방위대';
};

export const setStoredNickname = (name: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.NICKNAME, name);
};

export const DEFAULT_SEASONINGS = [
  '진간장', '국간장', '설탕', '올리고당', '소금', 
  '식용유', '참기름', '고추장', '된장', '다진마늘', 
  '고춧가루', '후추', '굴소스', '맛술'
];

export const getStoredSeasonings = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.SEASONINGS);
  return stored ? JSON.parse(stored) : null;
};

export const setStoredSeasonings = (seasonings: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SEASONINGS, JSON.stringify(seasonings));
};

export const getRecipeHistory = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_HISTORY);
  return stored ? JSON.parse(stored) : [];
};

export const addRecipeHistory = (recipe: any) => {
  if (typeof window === 'undefined') return;
  const history = getRecipeHistory();
  // 최신 순으로 상단에 추가 (최대 30개 유지)
  const newHistory = [{ ...recipe, savedAt: new Date().toISOString() }, ...history].slice(0, 30);
  localStorage.setItem(STORAGE_KEYS.RECIPE_HISTORY, JSON.stringify(newHistory));
};

export const getDailyUsage = () => {
  if (typeof window === 'undefined') return { date: '', count: 5 };
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_USAGE);
  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === today) {
      return data;
    }
  }
  // If not today or no data, reset
  const newData = { date: today, count: 5 };
  setDailyUsage(newData);
  return newData;
};

export const setDailyUsage = (data: { date: string, count: number }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(data));
};

export const decrementDailyUsage = () => {
  const usage = getDailyUsage();
  if (usage.count > 0) {
    usage.count -= 1;
    setDailyUsage(usage);
    return true;
  }
  return false;
};

export const rewardAdCharge = () => {
  const usage = getDailyUsage();
  usage.count = 5; // 광고 시청 시 5회 전체 충전
  setDailyUsage(usage);
};
