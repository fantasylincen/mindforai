// 测试环境兜底：Node 26 默认启用的 Web Storage 全局会遮蔽 jsdom 的 window.localStorage，这里在缺失时补一个内存实现
const createMemoryStorage = (): Storage => {
  const records = new Map<string, string>();
  return {
    get length() {
      return records.size;
    },
    key(index: number) {
      return Array.from(records.keys())[index] ?? null;
    },
    getItem(key: string) {
      const value = records.get(String(key));
      return value === undefined ? null : value;
    },
    setItem(key: string, value: string) {
      records.set(String(key), String(value));
    },
    removeItem(key: string) {
      records.delete(String(key));
    },
    clear() {
      records.clear();
    },
  } as Storage;
};

const ensureWebStorage = (name: 'localStorage' | 'sessionStorage') => {
  const current = (globalThis as unknown as Record<string, unknown>)[name] as Storage | undefined;
  if (current && typeof current.getItem === 'function') {
    return;
  }
  Object.defineProperty(globalThis, name, {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
};

ensureWebStorage('localStorage');
ensureWebStorage('sessionStorage');
