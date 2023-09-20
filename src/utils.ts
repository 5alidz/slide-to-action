import type { SwipeDirections } from 'react-swipeable';

export const oppositeDir = (directions: SwipeDirections): SwipeDirections => {
  if (directions === 'Left') return 'Right';
  return 'Left';
};

export const calcMinMax = (
  openFrom: 'Left' | 'Right',
  actionsWidth: number
) => {
  let min: number;
  let max: number;
  if (openFrom === 'Left') {
    min = 0;
    max = actionsWidth;
  } else {
    min = -actionsWidth;
    max = 0;
  }

  return [min, max] as [number, number];
};

export const calcSnap = (
  isOpening: boolean,
  passedThreshold: boolean,
  min: number,
  max: number,
  current: number
) => {
  const openValue = min === 0 ? max : min;
  const closeValue = 0;
  const isPreviousOpen = current === openValue;
  if (isOpening) {
    if (isPreviousOpen) return openValue;
    return passedThreshold ? openValue : closeValue;
  } else {
    if (!isPreviousOpen) return closeValue;
    return passedThreshold ? closeValue : openValue;
  }
};

export const elastic = (value: number, threshold: number) =>
  // eslint-disable-next-line no-nested-ternary -- it ok
  value === 0 ? value : value > 0 ? value + threshold : value - threshold;

export const clamp = (target: number, min: number, max: number) => {
  return Math.min(Math.max(target, min), max);
};

export function getDir(element: HTMLElement) {
  return getComputedStyle(element).direction as 'ltr' | 'rtl';
}
