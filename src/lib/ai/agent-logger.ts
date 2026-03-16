/**
 * Agent 日志模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 命理大师 Agent 专用日志工具
 */

const LOG_PREFIX = '[命理大师Agent]';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.info(`${LOG_PREFIX} ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`${LOG_PREFIX} ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`${LOG_PREFIX} ${message}`, ...args);
  },
};
