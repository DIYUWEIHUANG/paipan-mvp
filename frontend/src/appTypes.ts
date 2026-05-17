import type { ChartResult } from './calculators';
import type { XiaoLiurenMilestone2Result } from './features/xiaoliuren';

export type AppMode = 'liuren' | 'liuyao' | 'xiaoliuren';
export type AppResult = ChartResult | XiaoLiurenMilestone2Result;
