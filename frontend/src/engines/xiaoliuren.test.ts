import { describe, expect, it } from 'vitest';
import { calculateXiaoLiuren, type XiaoLiurenResult } from './xiaoliuren';

function expectPalaces(
  result: XiaoLiurenResult,
  expected: {
    month: string;
    day: string;
    hour: string;
    final: string;
  },
) {
  expect(result.steps.find((step) => step.step === 'month')?.result_palace).toBe(expected.month);
  expect(result.steps.find((step) => step.step === 'day')?.result_palace).toBe(expected.day);
  expect(result.steps.find((step) => step.step === 'hour')?.result_palace).toBe(expected.hour);
  expect(result.final_palace).toBe(expected.final);
  expect(result.debug_trace.length).toBeGreaterThan(0);
}

describe('calculateXiaoLiuren', () => {
  it('calculates manual lunar month/day/hour input for 子时', () => {
    const result = calculateXiaoLiuren({
      method: 'manual',
      timezone: 'Asia/Shanghai',
      questionText: 'manual zi hour',
      lunarMonth: 1,
      lunarDay: 1,
      hourBranch: '子',
    });

    expect(result.input.method).toBe('manual');
    expect(result.lunar.month).toBe(1);
    expect(result.lunar.day).toBe(1);
    expect(result.lunar.hour_branch).toBe('子');
    expectPalaces(result, {
      month: '大安',
      day: '大安',
      hour: '大安',
      final: '大安',
    });
  });

  it('calculates manual lunar month/day/hour input for 午时', () => {
    const result = calculateXiaoLiuren({
      method: 'manual',
      timezone: 'Asia/Shanghai',
      questionText: 'manual wu hour',
      lunarMonth: 5,
      lunarDay: 12,
      hourBranch: '午',
    });

    expect(result.input.method).toBe('manual');
    expect(result.lunar.month).toBe(5);
    expect(result.lunar.day).toBe(12);
    expect(result.lunar.hour_branch).toBe('午');
    expectPalaces(result, {
      month: '小吉',
      day: '赤口',
      hour: '赤口',
      final: '赤口',
    });
  });

  it('calculates time-based input and derives 亥时', () => {
    const result = calculateXiaoLiuren({
      method: 'time',
      questionTime: '2026-05-17T21:47',
      timezone: 'Asia/Shanghai',
      questionText: 'time based hai hour',
    });

    expect(result.input.method).toBe('time');
    expect(result.lunar.month).toBe(4);
    expect(result.lunar.day).toBe(1);
    expect(result.lunar.hour_branch).toBe('亥');
    expectPalaces(result, {
      month: '赤口',
      day: '赤口',
      hour: '速喜',
      final: '速喜',
    });
  });
});
