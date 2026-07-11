import { ref } from 'vue';

export interface TouchEventOptions {
  onLongPress?: () => void;
  onLongPressEnd?: () => void;
  onDoubleTouch?: () => void;
  onSingleTouch?: () => void;
}

export function useTouchEvents(options: TouchEventOptions = {}) {
  const longPressTimer = ref<number | null>(null);
  const touchDelayTimer = ref<number | null>(null);
  const doubleClickTimer = ref<number | null>(null);
  let isLongPressing = false;

  const handleTouchStart = (e: TouchEvent) => {
    isLongPressing = false;
    e.preventDefault();

    if (touchDelayTimer.value) {
      clearTimeout(touchDelayTimer.value);
      touchDelayTimer.value = null;

      doubleClickTimer.value = window.setTimeout(() => {
        doubleClickTimer.value = null;
      }, 200);
      return;
    }

    longPressTimer.value = window.setTimeout(() => {
      isLongPressing = true;
      options.onLongPress?.();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }

    if (doubleClickTimer.value) {
      clearTimeout(doubleClickTimer.value);
      doubleClickTimer.value = null;
      options.onDoubleTouch?.();
      return;
    }    if (isLongPressing) {
      isLongPressing = false;
      options.onLongPressEnd?.();
      return;
    }

    if (touchDelayTimer.value) {
      clearTimeout(touchDelayTimer.value);
    }

    if (!doubleClickTimer.value) {
      touchDelayTimer.value = window.setTimeout(() => {
        options.onSingleTouch?.();
        touchDelayTimer.value = null;
      }, 200);
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
    isLongPressing
  };
}
