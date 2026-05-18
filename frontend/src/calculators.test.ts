import { describe, expect, it } from 'vitest';
import { calculateManualLiuyao, calculateNumberLiuyao, calculateTimeLiuyao } from './calculators';
import { analyzeDaliurenTiming } from './engines/timing';

describe('liuyao automatic casting', () => {
  it('generates deterministic time-based lines', () => {
    const first = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:35', timezone: 'Asia/Shanghai' }, 'time test');
    const second = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:35', timezone: 'Asia/Shanghai' }, 'time test');

    expect(first.input.method).toBe('time');
    expect(first.input.manual_lines).toEqual([6, 9, 8, 6, 6, 7]);
    expect(first.input.manual_lines).toEqual(second.input.manual_lines);
    expect(first.base_hexagram.name).toBe(second.base_hexagram.name);
    expect(first.debug_trace.join('\n')).toContain('time_digits=20260518120835');
    expect(first.debug_trace.join('\n')).toContain('input_fingerprint=');
    expect(first.input_fingerprint.sourceInput).toBe('2026-05-18T12:08:35');
  });

  it('changes time-based lines when datetime changes', () => {
    const first = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:35', timezone: 'Asia/Shanghai' }, 'time test');
    const second = calculateTimeLiuyao({ datetime: '2026-05-18T12:08:36', timezone: 'Asia/Shanghai' }, 'time test');

    expect(first.input.manual_lines).not.toEqual(second.input.manual_lines);
    expect(first.input_fingerprint).not.toEqual(second.input_fingerprint);
  });

  it('generates deterministic number-based lines', () => {
    const first = calculateNumberLiuyao({ numbers: '88,27,63' }, 'number test');
    const second = calculateNumberLiuyao({ numbers: '88,27,63' }, 'number test');

    expect(first.input.method).toBe('number');
    expect(first.input.manual_lines).toEqual([8, 8, 8, 9, 8, 7]);
    expect(first.input.manual_lines).toEqual(second.input.manual_lines);
    expect(first.input_fingerprint).toEqual(second.input_fingerprint);
    expect(first.debug_trace.join('\n')).toContain('digit_total=34');
  });

  it('changes number-based lines when user numbers change', () => {
    const first = calculateNumberLiuyao({ numbers: '123456' }, 'number test');
    const second = calculateNumberLiuyao({ numbers: '654321' }, 'number test');

    expect(first.input.manual_lines).not.toEqual(second.input.manual_lines);
    expect(first.input_fingerprint.sourceInput).toBe('123456');
    expect(second.input_fingerprint.sourceInput).toBe('654321');
  });

  it('keeps manual mode and adds meta', () => {
    const result = calculateManualLiuyao([7, 8, 7, 8, 7, 8], 'manual test');

    expect(result.input.method).toBe('manual');
    expect(result.meta).toMatchObject({ mode: 'manual', algorithmVersion: 'liuyao-manual-v1' });
    expect(result.input_fingerprint.sourceInput).toBe('[7,8,7,8,7,8]');
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

describe('timing scale', () => {
  const transmissions = [
    { stage: '初传', branch: '子' },
    { stage: '中传', branch: '寅' },
    { stage: '末传', branch: '辰' },
  ];

  it('does not use immediate timing for career questions', () => {
    const timing = analyzeDaliurenTiming({
      currentDatetime: '2026-05-18T12:08:35+08:00',
      timezone: 'Asia/Shanghai',
      questionCategory: 'career',
      questionIntent: 'timing_advice',
      threeTransmissions: transmissions,
      xunkong: [],
    });

    expect(timing.timing_scale).toBe('medium_term');
    expect(timing.timing_windows[0].window).toContain('1-4周');
    expect(timing.debug_trace.join('\n')).toContain('timing_scale=medium_term');
    expect(timing.timing_windows.map((item) => item.window).join('\n')).not.toContain('当下至次日');
  });

  it('allows immediate timing for sleep health questions', () => {
    const timing = analyzeDaliurenTiming({
      currentDatetime: '2026-05-18T12:08:35+08:00',
      timezone: 'Asia/Shanghai',
      questionCategory: 'sleep_health',
      questionIntent: 'timing_advice',
      threeTransmissions: transmissions,
      xunkong: [],
    });

    expect(timing.timing_scale).toBe('immediate');
    expect(timing.timing_windows[0].window).toContain('数小时至当日');
  });
});
