export type WuxingElement = '木' | '火' | '土' | '金' | '水';
export type NameCharacterElement = WuxingElement | '未知';

export type NameWuxingApiResult = {
  name: string;
  elements: string[];
  characters: Array<{
    char: string;
    element: NameCharacterElement;
  }>;
};

export type NameWuxingProfile = {
  name: string;
  elements: Record<WuxingElement, number>;
  dominantElements: string[];
  weakElements: string[];
  characterAnalysis: Array<{
    char: string;
    wuxing: string;
    basis: string[];
    confidence: 'low' | 'medium' | 'high';
  }>;
};

export type PersonalizedInfluence = {
  chartElementFlow: string[];
  nameElementBias: Record<string, number>;
  supportScore: number;
  drainScore: number;
  conflictScore: number;
  controlScore: number;
  harmonyScore: number;
  usefulElements: string[];
  riskyElements: string[];
  summary: string;
  actionAdvice: string;
};
