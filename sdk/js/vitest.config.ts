// 提供 TypeScript 版本测试的 Vitest 配置
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
  },
});
