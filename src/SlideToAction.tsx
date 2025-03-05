import React from 'react';
import { clamp } from './utils';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

const actions = {
  left: [1, 2, 3],
  right: [4, 5],
};

const transition = 'transform 0.7s cubic-bezier(0.060, 0.975, 0.195, 0.985)';

const actionIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition,
};

function ActionIcon({ children }: { children: React.ReactNode }) {
  return <div style={actionIconStyle}>{children}</div>;
}

const setupConstraints = (
  actionWidth: number,
  actionsLeft: unknown[],
  actionsRight: unknown[]
) => {
  const _thresholdRight = actionsRight.length * actionWidth;
  const _maxElasticityRight = _thresholdRight + _thresholdRight / 4;
  const _thresholdLeft = actionsLeft.length * actionWidth;
  const _maxElasticityLeft = _thresholdLeft + _thresholdLeft / 4;
  const leftActionWidth = actionWidth + _maxElasticityLeft;
  const rightActionWidth = actionWidth + _maxElasticityRight;
  return {
    actionWidth,
    leftActionWidth,
    rightActionWidth,
    _thresholdRight,
    _maxElasticityRight,
    _thresholdLeft,
    _maxElasticityLeft,
  };
};

function defaultGetActionTheme(i: number, _dir: 'left' | 'right') {
  return {
    backgroundColor: `hsl(${i * 70}, 80%, 50%)`,
    color: `hsl(${i * 70}, 80%, 30%)`,
  };
}

export interface SlideToActionProps {
  actionsLeft?: React.ReactNode[];
  actionsRight?: React.ReactNode[];
  actionWidthPercentage?: number;
  borderRadius?: string;
  borderRadiusStrategy?: 'all' | 'actions-only' | 'card-only';
  getActionTheme?: (
    i: number,
    dir: 'left' | 'right'
  ) => { color: string; backgroundColor: string };
  children: React.ReactNode;
}

function createStyles({
  borderRadius,
  borderRadiusStrategy,
  rightActionWidth,
  leftActionWidth,
}: {
  borderRadius: SlideToActionProps['borderRadius'];
  borderRadiusStrategy: SlideToActionProps['borderRadiusStrategy'];
  rightActionWidth: number;
  leftActionWidth: number;
}) {
  const actionWrapperStyle = {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius,
  } as const;

  const cardStyle = {
    '--translate-x-amount': '0px',
    'transform': 'translateX(var(--translate-x-amount))',
    transition,
    'width': '100%',
    'height': '100%',
    'cursor': 'grab',
    'zIndex': 10,
    'overflow': 'hidden',
    'borderRadius':
      borderRadiusStrategy === 'card-only' || borderRadiusStrategy === 'all'
        ? borderRadius
        : '0px',
  } as const;

  const actionItemStyle = {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius:
      borderRadiusStrategy === 'actions-only' || borderRadiusStrategy === 'all'
        ? borderRadius
        : '0px',
    transform: `translateX(0px)`,
    transition,
  } as const;

  const actionItemRightStyle = {
    // right-specific
    right: 0,
    justifyContent: 'end',
    width: rightActionWidth,
  } as const;

  const actionItemLeftStyle = {
    // left-specific
    left: 0,
    justifyContent: 'start',
    width: leftActionWidth,
  } as const;

  return {
    actionWrapperStyle,
    cardStyle,
    actionItemStyle,
    actionItemRightStyle,
    actionItemLeftStyle,
  };
}

export function SlideToAction({
  actionsLeft = actions.left,
  actionsRight = actions.right,
  actionWidthPercentage = 0.2,
  borderRadius = '0px',
  borderRadiusStrategy = 'all',
  getActionTheme = defaultGetActionTheme,
  children,
}: SlideToActionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const actionsLeftRef = useRef<HTMLDivElement | null>(null);
  const actionsRightRef = useRef<HTMLDivElement | null>(null);
  const constraints = useRef<ReturnType<typeof setupConstraints> | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [preventScrollOnSwipe, setPreventScrollOnSwipe] = useState(false);

  const styles = useMemo(
    () =>
      createStyles({
        borderRadius,
        borderRadiusStrategy,
        rightActionWidth: constraints.current?.rightActionWidth || 0,
        leftActionWidth: constraints.current?.leftActionWidth || 0,
      }),
    [borderRadius, borderRadiusStrategy, constraints.current]
  );

  const onSwipeStart = useCallback(() => {
    setPreventScrollOnSwipe(true);
  }, []);

  const handlers = useSwipeable({
    preventScrollOnSwipe,
    onSwipeStart,
    trackMouse: true,
    onSwiping: ({ deltaX, dir }) => {
      if (!ref.current || !constraints.current) return;

      if (dir === 'Up' || dir === 'Down') return;

      const {
        _maxElasticityLeft,
        _maxElasticityRight,
        _thresholdLeft,
        _thresholdRight,
        actionWidth,
      } = constraints.current;

      setPreventScrollOnSwipe(true); // first

      const isActionsLeft =
        (dir === 'Right' && current >= 0) || (dir === 'Left' && current > 0);

      if (isActionsLeft && actionsRightRef.current) {
        actionsRightRef.current.style.display = 'none';
        if (actionsLeftRef.current) {
          actionsLeftRef.current.style.display = 'flex';
        }
      }

      if (!isActionsLeft && actionsLeftRef.current) {
        actionsLeftRef.current.style.display = 'none';
        if (actionsRightRef.current) {
          actionsRightRef.current.style.display = 'flex';
        }
      }

      const actionNode = isActionsLeft
        ? actionsLeftRef.current
        : actionsRightRef.current;

      const MAX_ELASTICITY = isActionsLeft
        ? _maxElasticityLeft
        : _maxElasticityRight;
      const THRESHOLD = isActionsLeft ? _thresholdLeft : _thresholdRight;

      const newValue = clamp(
        current +
          Math.sign(deltaX) *
            clamp(Math.abs(deltaX), -MAX_ELASTICITY, MAX_ELASTICITY),
        -MAX_ELASTICITY,
        MAX_ELASTICITY
      );

      const progress = newValue / THRESHOLD;

      if (actionNode) {
        const children = Array.from(actionNode.children) as HTMLElement[];
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const childsChild = child.children[0] as HTMLElement;
          const percentage = i / children.length;
          const value = percentage * newValue;

          child.style.transform = `translateX(${clamp(
            value,
            -MAX_ELASTICITY,
            MAX_ELASTICITY
          )}px)`;

          const middle =
            (clamp(Math.abs(progress), 0.2, Math.abs(progress)) * actionWidth) /
            2;
          const halfChildWidth = childsChild.clientWidth / 2;
          const offsetAmount = middle - halfChildWidth;
          childsChild.style.transform = `translateX(${
            Math.sign(progress) * clamp(offsetAmount, 4, actionWidth)
          }px)`;
        }
      }

      // update the transform
      ref.current.style.setProperty('--translate-x-amount', `${newValue}px`);
    },
    onSwiped: ({ deltaX, dir: _dir }) => {
      if (!ref.current || !constraints.current) return;
      // normalize the dir
      let dir = _dir;
      if (_dir === 'Up' || _dir === 'Down') {
        dir = deltaX > 0 ? 'Right' : 'Left';
      }

      const { _thresholdLeft, _thresholdRight, actionWidth } =
        constraints.current;

      const isActionsLeft =
        (dir === 'Right' && current >= 0) || (dir === 'Left' && current > 0);

      const THRESHOLD = isActionsLeft ? _thresholdLeft : _thresholdRight;

      const isPassedThreshold = Math.abs(deltaX) > THRESHOLD / 2;

      const _new = isPassedThreshold
        ? clamp(current + Math.sign(deltaX) * THRESHOLD, -THRESHOLD, THRESHOLD)
        : current;

      const actionNode = isActionsLeft
        ? actionsLeftRef.current
        : actionsRightRef.current;

      if (actionNode) {
        const children = Array.from(actionNode.children) as HTMLElement[];
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const childsChild = child.children[0] as HTMLElement;

          const closedPos = 0;
          const openedPos = Math.sign(_new) * i * actionWidth;
          const isOpened = _new === Math.sign(_new) * THRESHOLD;
          child.style.transform = `translateX(${
            isOpened ? openedPos : closedPos
          }px)`;

          const middle = actionWidth / 2;
          const halfChildWidth = childsChild.clientWidth / 2;
          childsChild.style.transform = `translateX(${
            isOpened ? Math.sign(_new) * (middle - halfChildWidth) : 0
          }px)`;
        }
      }

      setCurrent(_new);
      ref.current.style.setProperty('--translate-x-amount', `${_new}px`);
      setPreventScrollOnSwipe(false); // finally
    },
  });

  const setupCard = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    ref.current = node;

    const cardWidth = node.clientWidth;
    // now we calculate the width of an individual action as a percentage of the card width
    const actionWidth = cardWidth * actionWidthPercentage;
    constraints.current = setupConstraints(
      actionWidth,
      actionsLeft,
      actionsRight
    );
  }, []);

  return (
    <div style={{ position: 'relative' }} {...handlers}>
      <div style={styles.actionWrapperStyle}>
        <div ref={actionsLeftRef}>
          {actionsLeft.map((C, i) => (
            <div
              key={i}
              style={{
                ...styles.actionItemStyle,
                ...styles.actionItemLeftStyle,
                ...getActionTheme(i, 'left'),
              }}
            >
              <ActionIcon>{C}</ActionIcon>
            </div>
          ))}
        </div>
        <div ref={actionsRightRef}>
          {actionsRight.map((C, i) => (
            <div
              key={i}
              style={{
                ...styles.actionItemStyle,
                ...styles.actionItemRightStyle,
                ...getActionTheme(i, 'right'),
              }}
            >
              <ActionIcon>{C}</ActionIcon>
            </div>
          ))}
        </div>
      </div>
      <div ref={setupCard} style={styles.cardStyle}>
        {children}
      </div>
    </div>
  );
}
