import { describe, expect, it } from 'vitest';
import { calculateManualLiuyao, calculateNumberLiuyao, calculateTimeLiuyao } from './calculators';

describe('liuyao automatic casting', () => {
  it('generates deterministic time-based lines', () => {
    const first = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:35', timezone: 'Asia/Shanghai' }, 'time test');
    const second = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:35', timezone: 'Asia/Shanghai' }, 'time test');

    expect(first.input.method).toBe('time');
    expect(first.input.manual_lines).toEqual([6, 9, 8, 6, 6, 7]);
    expect(first.input.manual_lines).toEqual(second.input.manual_lines);
    expect(first.base_hexagram.name).toBe(second.base_hexagram.name);
    expect(first.debug_trace.join('\n')).toContain('time_digits=20260518120835');
  });

  it('generates deterministic number-based lines', () => {
    const first = calculateNumberLiuyao({ numbers: '88,27,63' }, 'number test');
    const second = calculateNumberLiuyao({ numbers: '88,27,63' }, 'number test');

    expect(first.input.method).toBe('number');
    expect(first.input.manual_lines).toEqual([8, 8, 8, 9, 8, 7]);
    expect(first.input.manual_lines).toEqual(second.input.manual_lines);
    expect(first.debug_trace.join('\n')).toContain('digit_total=34');
  });

  it('keeps manual mode and adds meta', () => {
    const result = calculateManualLiuyao([7, 8, 7, 8, 7, 8], 'manual test');

    expect(result.input.method).toBe('manual');
    expect(result.meta).toMatchObject({ mode: 'manual', algorithmVersion: 'liuyao-manual-v1' });
    expect(result.milestone).toBe(12);
  });

  it('analyzes wuxing generating and controlling relations', () => {
    const generating = calculateManualLiuyao([8, 8, 8, 8, 7, 6]);
    const controlling = calculateManualLiuyao([8, 8, 8, 7, 6, 7]);

    expect(generating.wuxing.relation_arrow).toBe('水 -> 生 木');
    expect(generating.wuxing.relation).toBe('生');
    expect(controlling.wuxing.relation_arrow).toBe('火 -> 克 金');
    expect(controlling.wuxing.relation).toBe('克');
  });
});
