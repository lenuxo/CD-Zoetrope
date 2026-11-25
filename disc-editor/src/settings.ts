export type AnimationExample = 'koi' | 'ball';
export type RotationDirection = 1 | -1;
export type NumericSetting = 'count' | 'size' | 'jump' | 'diameter' | 'height' | 'band' | 'outer' | 'inner';

export type DiscSettings = Record<NumericSetting, number> & {
  example: AnimationExample;
  direction: RotationDirection;
  repeats: number;
  guides: boolean;
};

export interface RangeSpec {
  id: NumericSetting;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  group: 'art' | 'print';
  example?: AnimationExample;
}

export const bandRange: RangeSpec = {
  id: 'band', label: '标记环宽', min: 3, max: 8, step: 0.5, unit: 'mm', group: 'art',
};

export const ranges: readonly RangeSpec[] = [
  { id: 'count', label: '帧数', min: 8, max: 18, step: 1, unit: '帧', group: 'art' },
  { id: 'size', label: '游鱼长度', min: 8, max: 20, step: 0.5, unit: 'mm', group: 'art', example: 'koi' },
  { id: 'jump', label: '摆尾幅度', min: 10, max: 100, step: 5, unit: '%', group: 'art', example: 'koi' },
  { id: 'diameter', label: '球直径', min: 4, max: 10, step: 0.5, unit: 'mm', group: 'art', example: 'ball' },
  { id: 'height', label: '跳动幅度', min: 3, max: 14, step: 0.5, unit: 'mm', group: 'art', example: 'ball' },
  { id: 'outer', label: '可印外径', min: 110, max: 118, step: 0.5, unit: 'mm', group: 'print' },
  { id: 'inner', label: '可印内径', min: 22, max: 40, step: 0.5, unit: 'mm', group: 'print' },
];

export const defaults: DiscSettings = {
  example: 'koi',
  repeats: 1,
  direction: 1,
  guides: false,
  count: 12,
  size: 16,
  jump: 100,
  diameter: 8,
  height: 10,
  band: 7,
  outer: 112,
  inner: 36,
};
