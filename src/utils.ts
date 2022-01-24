export function setLocal(key: string, val: unknown) {
  window.localStorage.setItem(key, JSON.stringify(val));
}

export function getLocal<T>(key: string) {
  const str = window.localStorage.getItem(key);
  return str && (JSON.parse(str) as T);
}

export function getSizeDesc(num: number) {
  if (!num) return "??";
  if (num < 1024) return `${num}KB`;
  if (1024 <= num && num < 1048576) return `${(num / 1024).toFixed(2)}MB`;
  return `${(num / 1048576).toFixed(2)}GB`;
}
