import { useCallback, useState } from 'react';

export type SoDensity = 'comfy' | 'compact';
export type SoRadius = 'soft' | 'round' | 'crisp';
export type SoCanvas = 'light' | 'sage' | 'mist';

export interface SoTweaks {
  density: SoDensity;
  radius: SoRadius;
  canvas: SoCanvas;
  motion: boolean;
}

export const TWEAK_DEFAULTS: SoTweaks = {
  density: 'comfy',
  radius: 'soft',
  canvas: 'light',
  motion: true,
};

const TWEAK_STORAGE_KEY = 'so-tweaks';
const TWEAK_OPEN_KEY = 'so-tweaks-open';

const DENSITIES: SoDensity[] = ['comfy', 'compact'];
const RADII: SoRadius[] = ['soft', 'round', 'crisp'];
const CANVASES: SoCanvas[] = ['light', 'sage', 'mist'];

const pick = <T extends string,>(options: T[], value: unknown, fallback: T): T => {
  const match = options.find((option: T) => option === value);
  return match ?? fallback;
};

const readStoredTweaks = (): SoTweaks => {
  try {
    const raw = window.localStorage.getItem(TWEAK_STORAGE_KEY);
    if (!raw) return TWEAK_DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return TWEAK_DEFAULTS;
    const record = parsed as Record<string, unknown>;

    return {
      density: pick(DENSITIES, record.density, TWEAK_DEFAULTS.density),
      radius: pick(RADII, record.radius, TWEAK_DEFAULTS.radius),
      canvas: pick(CANVASES, record.canvas, TWEAK_DEFAULTS.canvas),
      motion: typeof record.motion === 'boolean' ? record.motion : TWEAK_DEFAULTS.motion,
    };
  } catch {
    return TWEAK_DEFAULTS;
  }
};

export const readStoredTweaksOpen = (): boolean => {
  try {
    return window.localStorage.getItem(TWEAK_OPEN_KEY) === '1';
  } catch {
    return false;
  }
};

const persist = (value: unknown, key: string): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — tweaks stay in memory for this session */
  }
};

export type SetTweak = (edits: Partial<SoTweaks>) => void;

export const useTweaks = (defaults: SoTweaks): [SoTweaks, SetTweak] => {
  const [values, setValues] = useState<SoTweaks>(() => {
    const stored = readStoredTweaks();
    return { ...defaults, ...stored };
  });

  const setTweak = useCallback<SetTweak>((edits: Partial<SoTweaks>) => {
    setValues((prev: SoTweaks) => {
      const next: SoTweaks = { ...prev, ...edits };
      persist(next, TWEAK_STORAGE_KEY);
      return next;
    });
  }, []);

  return [values, setTweak];
};
