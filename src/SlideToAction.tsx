import * as React from 'react';
import { SwipeCallback, useSwipeable } from 'react-swipeable';
import {
  oppositeDir,
  calcMinMax,
  calcSnap,
  elastic,
  clamp,
  getDir,
} from './utils';

const { useState, useCallback, useRef } = React;

export interface ActionProps {
  index: number;
  progress: number;
  close(): void;
}

export type Action = React.FC<ActionProps>;

export interface SlideToActionProps {
  actions: Action[];
  Content: React.ReactNode;
  width?: number;
  actionsContainerClassName?: string;
  actionsWidth?: number;
  threshold?: number;
  openFrom?: 'Left' | 'Right';
  trackMouse?: boolean;
}

export function SlideToAction({
  Content,
  width,
  actions,
  actionsContainerClassName,
  openFrom,
  trackMouse = false,
  actionsWidth = 0.35,
  threshold = actionsWidth / 2,
}: SlideToActionProps) {
  const [preventScrollOnSwipe, setPreventScrollOnSwipe] = useState(false);
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onSwiping: SwipeCallback = useCallback(
    ({ dir, deltaX }) => {
      const noopDir = dir === 'Up' || dir === 'Down';
      if (!ref.current || noopDir) return;
      setPreventScrollOnSwipe(true);
      const elementDir = getDir(ref.current);
      const autoOpenFrom = elementDir === 'ltr' ? 'Left' : 'Right';
      const openDir = openFrom || autoOpenFrom;
      const [min, max] = calcMinMax(openDir, actionsWidth);
      const w = ref.current.clientWidth;
      const amount = clamp(
        current * w + deltaX,
        elastic(min, threshold) * w,
        elastic(max, threshold) * w
      );

      ref.current.style.transform = `translateX(${amount}px)`;
      const available = Math.abs(amount / w);
      actionsRef.current?.style.setProperty('--available', `${available}`);
      setProgress(Math.abs(available / actionsWidth));
    },
    [actionsWidth, openFrom, threshold, current]
  );

  const onSwiped: SwipeCallback = useCallback(
    ({ dir, deltaX }) => {
      setPreventScrollOnSwipe(false);
      if (!ref.current) return;
      if (dir === 'Up' || dir === 'Down') {
        ref.current.style.transform = `translateX(${0}px)`;
        setCurrent(0);
        return;
      }
      const w = ref.current.clientWidth;
      const passedThreshold = Math.abs(deltaX) >= threshold * w;
      const openDir =
        openFrom || (getDir(ref.current) === 'ltr' ? 'Left' : 'Right');
      const isOpening = dir === oppositeDir(openDir);

      const [min, max] = calcMinMax(openDir, actionsWidth);
      const newValue = calcSnap(isOpening, passedThreshold, min, max, current);
      const snapPixels = newValue * w;

      const amount = clamp(
        current * w + deltaX,
        elastic(min, threshold) * w,
        elastic(max, threshold) * w
      );

      const snap = () => {
        if (!ref.current) return;
        ref.current.style.transform = `translateX(${snapPixels}px)`;
        actionsRef.current?.style.setProperty(
          '--available',
          `${Math.abs(newValue)}`
        );
        setCurrent(newValue);
        setProgress(Math.abs(newValue / actionsWidth));
      };

      if (snapPixels !== 0 && Math.abs(snapPixels) < Math.abs(amount)) {
        const maxAmount =
          openDir === 'Right'
            ? elastic(min, threshold)
            : elastic(max, threshold);
        ref.current.style.transform = `translateX(${maxAmount * w}px)`;
        actionsRef.current?.style.setProperty(
          '--available',
          `${Math.abs(maxAmount)}`
        );
        setTimeout(() => {
          snap();
        }, 150);
      } else {
        snap();
      }
    },
    [actionsWidth, openFrom, threshold, current]
  );

  const onSwipeStart = useCallback(() => {
    setPreventScrollOnSwipe(true);
  }, []);

  const eventHandlers = useSwipeable({
    onSwipeStart,
    preventScrollOnSwipe,
    trackMouse,
    onSwiping,
    onSwiped,
  });

  const close = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = `translateX(${0}px)`;
    setCurrent(0);
  }, []);

  const directionStyle = React.useMemo(() => {
    if (openFrom === 'Left') {
      return { left: 0 };
    } else if (openFrom === 'Right') {
      return { right: 0 };
    } else {
      return { inset: 0 };
    }
  }, [openFrom]);

  return (
    <div
      {...eventHandlers}
      style={{
        width: typeof width === 'number' ? `${width}px` : '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={actionsRef}
        style={{
          ...directionStyle,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: `calc(var(--available)*100%)`,
        }}
      >
        <div
          className={actionsContainerClassName}
          style={
            actionsContainerClassName
              ? undefined
              : {
                  display: 'flex',
                  alignItems: 'stretch',
                  width: '100%',
                  height: '100%',
                }
          }
        >
          {actions.map((Action, index) => (
            <Action
              key={index}
              index={index}
              progress={progress}
              close={close}
            />
          ))}
        </div>
      </div>
      <div
        ref={ref}
        style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          touchAction: preventScrollOnSwipe ? 'none' : 'auto',
          transitionProperty: 'transform',
          transitionDuration: '700ms',
          transitionTimingFunction: 'cubic-bezier(0.060, 0.975, 0.195, 0.985)',
        }}
      >
        {Content}
      </div>
    </div>
  );
}
