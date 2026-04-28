interface HistoryItem {
  slug: string;
  title: string;
  poster: string;
  lastEpisode: string;
  watchedAt: number;
}

const HISTORY_KEY = 'vteen_watch_history';

export const saveToHistory = (item: Omit<HistoryItem, 'watchedAt'>) => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    watchedAt: Date.now()
  };

  // Loại bỏ bản ghi cũ cùng slug (nếu có) và đưa bản mới lên đầu
  const filtered = history.filter(h => h.slug !== item.slug);
  const updated = [newItem, ...filtered].slice(0, 20); // Giới hạn 20 phim gần nhất

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const getHistory = (): HistoryItem[] => {
  const data = localStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};
