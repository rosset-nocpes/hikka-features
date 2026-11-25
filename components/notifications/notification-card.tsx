import type { ReactNode } from 'react';

import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import MaterialSymbolsCheckCircleRounded from '~icons/material-symbols/check-circle-rounded';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsErrorRounded from '~icons/material-symbols/error-rounded';
import MaterialSymbolsInfoRounded from '~icons/material-symbols/info-rounded';
import MaterialSymbolsNotificationsRounded from '~icons/material-symbols/notifications-rounded';
import MaterialSymbolsWarningRounded from '~icons/material-symbols/warning-rounded';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  type AppNotification,
  durationOf,
  type NotificationTone,
  notify,
} from '@/utils/notify';

/** How far, or how fast, a swipe has to go to dismiss. */
const SWIPE_DISTANCE = 96;
const SWIPE_VELOCITY = 600;

const TONES: Record<NotificationTone, { icon: ReactNode; className: string }> =
  {
    default: {
      icon: <MaterialSymbolsNotificationsRounded />,
      className: 'bg-foreground/8 text-foreground',
    },
    success: {
      icon: <MaterialSymbolsCheckCircleRounded />,
      className: 'bg-success/15 text-success',
    },
    info: {
      icon: <MaterialSymbolsInfoRounded />,
      className: 'bg-info/15 text-info',
    },
    warning: {
      icon: <MaterialSymbolsWarningRounded />,
      className: 'bg-warning/15 text-warning',
    },
    error: {
      icon: <MaterialSymbolsErrorRounded />,
      className: 'bg-destructive/15 text-destructive',
    },
  };

const TIMER_COLORS: Record<NotificationTone, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-destructive',
};

interface NotificationCardProps {
  notification: AppNotification;
  /** Behind the front one in the collapsed stack: only its edge shows. */
  covered: boolean;
  paused: boolean;
  /** Reports the card's natural height, for the stack's layout. */
  onHeight: (id: string, height: number) => void;
}

/** One notification's content, the timer that dismisses it and its swipe. */
export const NotificationCard = ({
  notification,
  covered,
  paused,
  onHeight,
}: NotificationCardProps) => {
  const {
    id,
    version,
    eyebrow,
    title,
    description,
    media,
    tone = 'default',
    actions = [],
    dismissible = true,
    urgent,
  } = notification;
  const duration = durationOf(notification);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<number>();
  const [swiped, setSwiped] = useState(false);

  // Fades out as it's swiped away; the stack owns the card's own opacity.
  const x = useMotionValue(0);
  const swipeOpacity = useTransform(
    x,
    [-SWIPE_DISTANCE * 2, 0, SWIPE_DISTANCE * 2],
    [0, 1, 0],
  );

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      onHeight(id, element.offsetHeight),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, onHeight]);

  const dismiss = () => {
    if (dismissible) notify.dismiss(id, 'user');
  };

  const onDragEnd = (_event: unknown, { offset, velocity }: PanInfo) => {
    const direction = Math.sign(offset.x);
    if (
      Math.abs(offset.x) < SWIPE_DISTANCE &&
      Math.abs(velocity.x) < SWIPE_VELOCITY
    ) {
      void animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
      return;
    }
    setSwiped(true);
    void animate(x, direction * 480, {
      duration: 0.2,
      ease: 'easeOut',
    }).then(() => notify.dismiss(id, 'user'));
  };

  const runAction = async (index: number) => {
    const action = actions[index];
    if (!action || pending !== undefined) return;
    setPending(index);
    try {
      await action.onClick();
      if (!action.keepOpen) notify.dismiss(id, 'action');
    } catch (error) {
      console.error(error);
    } finally {
      setPending(undefined);
    }
  };

  const timed = Number.isFinite(duration) && duration > 0;

  return (
    <motion.div
      role={urgent ? 'alert' : 'status'}
      aria-atomic
      // Covered cards are only the stack's backdrop.
      aria-hidden={covered || undefined}
      inert={covered || undefined}
      tabIndex={covered ? undefined : -1}
      drag={dismissible && !swiped ? 'x' : false}
      dragDirectionLock
      dragMomentum={false}
      dragElastic={{ left: 0.9, right: 0.9 }}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && dismissible) {
          event.stopPropagation();
          dismiss();
        }
      }}
      style={{ x, opacity: swipeOpacity }}
      className="group/notification relative size-full cursor-default touch-pan-y outline-none select-none"
    >
      <motion.div
        ref={contentRef}
        initial={false}
        animate={{ opacity: covered ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3 p-3"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {media ?? (
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full [&_svg]:size-5',
                  TONES[tone].className,
                )}
              >
                {TONES[tone].icon}
              </span>
            )}
          </div>
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-0.5 self-center',
              dismissible && 'pr-5',
            )}
          >
            {eyebrow && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium [&_svg]:size-3.5">
                {eyebrow}
              </div>
            )}
            <div className="text-sm leading-snug font-medium text-pretty">
              {title}
            </div>
            {description && (
              <div className="text-muted-foreground text-xs leading-snug text-pretty">
                {description}
              </div>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.primary ? 'default' : 'secondary'}
                disabled={pending !== undefined}
                onClick={() => void runAction(index)}
                className="h-8 flex-1 gap-1.5 rounded-md px-3"
              >
                {pending === index ? <Spinner /> : action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </motion.div>

      {dismissible && !covered && (
        <button
          type="button"
          aria-label="Закрити"
          onClick={dismiss}
          className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:ring-ring absolute top-2 right-2 grid size-6 place-items-center rounded-full opacity-0 transition-opacity outline-none group-focus-within/notification:opacity-100 group-hover/notification:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 pointer-coarse:opacity-100 [&_svg]:size-4"
        >
          <MaterialSymbolsCloseRounded />
        </button>
      )}

      {timed && (
        <span
          // A new version starts the timer over.
          key={version}
          aria-hidden
          onAnimationEnd={() => notify.dismiss(id, 'timeout')}
          style={{
            animation: `notification-timer ${duration}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
          className={cn(
            'absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-60 transition-opacity',
            TIMER_COLORS[tone],
            covered && 'opacity-0',
          )}
        />
      )}
    </motion.div>
  );
};
