/**
 * 現在のISO8601形式の日時文字列を取得
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * 現在のUnixタイムスタンプを取得
 */
export function nowTimestamp(): number {
  return Date.now();
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 日付からストレージパスを生成
 * 形式: YYYY/MM/DD
 */
export function getStoragePath(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

/**
 * ISO8601文字列をDateに変換
 */
export function parseISO(isoString: string): Date {
  return new Date(isoString);
}

/**
 * 相対時間を計算（例: "2 hours ago"）
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  }
  if (diffHour > 0) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }
  if (diffMin > 0) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }
  return 'just now';
}
