import React, { useCallback, useEffect, useRef, useState } from 'react';

import './tweaks-panel.css';

export interface TweaksPanelProps {
  title: string;
  toggleLabel: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

interface Offset {
  x: number;
  y: number;
}

export const TweaksPanel: React.FC<TweaksPanelProps> = ({
  title,
  toggleLabel,
  open,
  onOpen,
  onClose,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<Offset>({ x: 16, y: 16 });
  const pad = 16;

  const clampToViewport = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const maxRight = Math.max(pad, window.innerWidth - width - pad);
    const maxTop = Math.max(pad, window.innerHeight - height - pad);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(pad, offsetRef.current.x)),
      y: Math.min(maxTop, Math.max(pad, offsetRef.current.y)),
    };
    panel.style.right = `${offsetRef.current.x}px`;
    panel.style.top = `${offsetRef.current.y}px`;
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [open, clampToViewport]);

  const onDragStart = (event: React.MouseEvent<HTMLDivElement>): void => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRight = window.innerWidth - rect.right;
    const startTop = rect.top;

    const onMove = (moveEvent: MouseEvent): void => {
      offsetRef.current = {
        x: startRight - (moveEvent.clientX - startX),
        y: startTop + (moveEvent.clientY - startY),
      };
      clampToViewport();
    };

    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!open) {
    return (
      <button type="button" className="twk-fab" onClick={onOpen}>
        {toggleLabel}
      </button>
    );
  }

  return (
    <div ref={panelRef} className="twk-panel">
      <div className="twk-hd" onMouseDown={onDragStart}>
        <b>{title}</b>
        <button
          type="button"
          className="twk-x"
          aria-label={title}
          onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="twk-body">{children}</div>
    </div>
  );
};

export interface TweakSectionProps {
  label: string;
  children?: React.ReactNode;
}

export const TweakSection: React.FC<TweakSectionProps> = ({ label, children }) => (
  <React.Fragment>
    <div className="twk-sect">{label}</div>
    {children}
  </React.Fragment>
);

export interface TweakOption<T extends string> {
  value: T;
  label: string;
}

export interface TweakRadioProps<T extends string> {
  label: string;
  value: T;
  options: TweakOption<T>[];
  onChange: (value: T) => void;
}

export const TweakRadio = <T extends string,>({
  label,
  value,
  options,
  onChange,
}: TweakRadioProps<T>): React.ReactElement => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const valueRef = useRef<T>(value);
  valueRef.current = value;

  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((option: TweakOption<T>) => option.value === value),
  );

  const segAt = (clientX: number): T => {
    const track = trackRef.current;
    if (!track) return valueRef.current;
    const rect = track.getBoundingClientRect();
    const inner = rect.width - 4;
    const raw = Math.floor(((clientX - rect.left - 2) / inner) * count);
    return options[Math.max(0, Math.min(count - 1, raw))].value;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    setDragging(true);
    const initial = segAt(event.clientX);
    if (initial !== valueRef.current) onChange(initial);

    const onMove = (moveEvent: PointerEvent): void => {
      const next = segAt(moveEvent.clientX);
      if (next !== valueRef.current) onChange(next);
    };

    const onUp = (): void => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <div
        ref={trackRef}
        role="radiogroup"
        aria-label={label}
        onPointerDown={onPointerDown}
        className={dragging ? 'twk-seg dragging' : 'twk-seg'}
      >
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${index} * (100% - 4px) / ${count})`,
            width: `calc((100% - 4px) / ${count})`,
          }}
        ></div>
        {options.map((option: TweakOption<T>) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export interface TweakToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const TweakToggle: React.FC<TweakToggleProps> = ({ label, value, onChange }) => (
  <div className="twk-row twk-row-h">
    <div className="twk-lbl">
      <span>{label}</span>
    </div>
    <button
      type="button"
      className="twk-toggle"
      data-on={value ? '1' : '0'}
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
    >
      <i></i>
    </button>
  </div>
);
