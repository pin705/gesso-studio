export type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

export interface Keyframe<T = number> {
  time: number;
  value: T;
  easing?: EasingName;
}

export interface TimelineDefinition {
  duration: number;
  fps: number;
  loop: boolean;
  tracks: Record<string, Keyframe[]>;
}

export const EASING_PRESETS: Record<Exclude<EasingName, 'cubic-bezier'>, (value: number) => number> = {
  linear: (value) => value,
  'ease-in': (value) => value * value * value,
  'ease-out': (value) => 1 - (1 - value) ** 3,
  'ease-in-out': (value) => value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2
};

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (value: number) => number {
  return (value: number) => {
    const sample = (t: number, first: number, second: number) => {
      const inverse = 1 - t;
      return 3 * inverse * inverse * t * first + 3 * inverse * t * t * second + t * t * t;
    };
    const derivative = (t: number, first: number, second: number) => 3 * (1 - t) ** 2 * first + 6 * (1 - t) * t * (second - first) + 3 * t ** 2 * (1 - second);
    let low = 0;
    let high = 1;
    let t = value;
    for (let index = 0; index < 8; index += 1) {
      const x = sample(t, x1, x2);
      if (Math.abs(x - value) < 0.0001) break;
      if (x < value) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sample(t, y1, y2);
  };
}

export function evaluateEasing(name: EasingName = 'linear', value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  if (name === 'cubic-bezier') return cubicBezier(0.22, 1, 0.36, 1)(clamped);
  return EASING_PRESETS[name](clamped);
}

export function sampleKeyframes(keyframes: Keyframe[], time: number, fallback = 0): number {
  if (!keyframes.length) return fallback;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const next = sorted[index];
    if (time <= next.time) {
      const progress = (time - previous.time) / Math.max(0.0001, next.time - previous.time);
      return previous.value + (next.value - previous.value) * evaluateEasing(next.easing, progress);
    }
  }
  return fallback;
}
