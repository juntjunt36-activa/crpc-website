'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FitNumberProps {
  children: React.ReactNode;
  maxFontSize?: number;
  minFontSize?: number;
  className?: string;
}

/**
 * Auto-shrinks the rendered text so it fits the parent's width on one line.
 * Re-measures on container resize and after web fonts finish loading.
 */
export function FitNumber({
  children,
  maxFontSize = 30,
  minFontSize = 12,
  className,
}: FitNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [, setTick] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    let mounted = true;

    const fit = () => {
      if (!mounted) return;
      let size = maxFontSize;
      inner.style.fontSize = `${size}px`;
      // Shrink until it fits, but no smaller than minFontSize.
      while (size > minFontSize && inner.scrollWidth > container.clientWidth) {
        size -= 1;
        inner.style.fontSize = `${size}px`;
      }
      setTick((n) => n + 1);
    };

    fit();
    const ro = new ResizeObserver(() => fit());
    ro.observe(container);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => fit());
    }

    return () => {
      mounted = false;
      ro.disconnect();
    };
  }, [children, maxFontSize, minFontSize]);

  return (
    <div
      ref={containerRef}
      className={cn('w-full overflow-hidden leading-tight', className)}
    >
      <span
        ref={innerRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: `${maxFontSize}px`,
        }}
      >
        {children}
      </span>
    </div>
  );
}
