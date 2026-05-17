import type { ChartResult } from './calculators';
import type { XiaoLiurenResult } from './engines/xiaoliuren';

export type AppMode = 'liuren' | 'liuyao' | 'xiaoliuren';
export type AppResult = ChartResult | XiaoLiurenResult;
