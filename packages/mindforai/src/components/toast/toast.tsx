import classNames from 'classnames';
import { FloatingPortal } from '@floating-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './toast.scss';

export const DEFAULT_TOAST_DURATION = 4000;

export type MindForAIToastType = 'info' | 'success' | 'error';

export type MindForAIToastOptions = {
  message: string;
  description?: string;
  type?: MindForAIToastType;
  duration?: number;
};

export type MindForAIToast = {
  id: number;
  message: string;
  description?: string;
  type: MindForAIToastType;
};

export const useToast = () => {
  const [toast, setToast] = useState<MindForAIToast | null>(null);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((toastOptions: MindForAIToastOptions) => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    const duration = toastOptions.duration ?? DEFAULT_TOAST_DURATION;

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({
      id,
      message: toastOptions.message,
      description: toastOptions.description,
      type: toastOptions.type || 'info',
    });

    if (duration > 0) {
      toastTimerRef.current = window.setTimeout(() => {
        setToast((currentToast) => (currentToast?.id === id ? null : currentToast));
        toastTimerRef.current = null;
      }, duration);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return { toast, showToast };
};

export const Toast = ({
  toast,
  container,
}: {
  toast: MindForAIToast | null;
  container?: HTMLElement | null;
}) => {
  return (
    <FloatingPortal root={container} preserveTabOrder={false}>
      {toast && (
        <div className="mindforai-toast-wrapper" aria-live="polite" aria-atomic="true">
          <div
            role="status"
            className={classNames('mindforai-toast', `mindforai-toast--${toast.type}`)}
          >
            <div className="mindforai-toast__message">{toast.message}</div>
            {toast.description && (
              <div className="mindforai-toast__description">{toast.description}</div>
            )}
          </div>
        </div>
      )}
    </FloatingPortal>
  );
};
