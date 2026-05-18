import { describe, expect, it } from 'vitest';
import { calculateManualLiuyao } from '../calculators';
import { buildNameWuxingProfile, personalizeChart } from './personalizedChart';

const yangBingChen = {
  name: '杨丙辰',
  elements: ['木', '火', '土'],
  characters: [
    { char: '杨', element: '木' as const },
    { char: '丙', element: '火' as const },
    { char: '辰', element: '土' as const },
  ],
};

describe('personalized name wuxing chart', () => {
  it('builds Yang Bing Chen as wood fire earth structure', () => {
    const profile = buildNameWuxingProfile(yangBingChen);

    expect(profile.elements.木).toBeGreaterThan(0);
    expect(profile.elements.火).toBeGreaterThan(0);
    expect(profile.elements.土).toBeGreaterThan(0);
    expect(profile.weakElements).toEqual(['金', '水']);
    expect(profile.dominantElements).toEqual(['木', '火', '土']);
  });

  it('keeps the same raw chart while different names change personalized chart', () => {
    const raw = calculateManualLiuyao([7, 8, 7, 8, 7, 8], 'same raw');
    const firstProfile = buildNameWuxingProfile(yangBingChen);
    const secondProfile = buildNameWuxingProfile({
      name: '辛酉',
      elements: ['金'],
      characters: [
        { char: '辛', element: '金' },
        { char: '酉', element: '金' },
      ],
    });

    const first = personalizeChart(raw, firstProfile);
    const second = personalizeChart(raw, secondProfile);

    expect(first.rawChart).toEqual(second.rawChart);
    expect(first.type).toBe('liu_yao');
    expect(second.type).toBe('liu_yao');
    if (first.type === 'liu_yao' && second.type === 'liu_yao') {
      expect(first.base_hexagram).toEqual(second.base_hexagram);
    }
    expect(first.personalizedChart).not.toEqual(second.personalizedChart);
  });

  it('is stable for the same name and same chart', () => {
    const raw = calculateManualLiuyao([7, 8, 7, 8, 7, 8], 'stable');
    const profile = buildNameWuxingProfile(yangBingChen);

    expect(personalizeChart(raw, profile)).toEqual(personalizeChart(raw, profile));
  });
});
