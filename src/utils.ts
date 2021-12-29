export function setLocal(key: string, val: unknown) {
  window.localStorage.setItem(key, JSON.stringify(val));
}

export function getLocal<T>(key: string) {
  const str = window.localStorage.getItem(key);
  return str && (JSON.parse(str) as T);
}
