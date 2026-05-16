"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

import {
  ACCENT_KEYS,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  MODE_KEYS,
  nextAccent,
  nextMode,
  type AccentKey,
  type ModeKey,
} from "@/lib/theme";

const STORAGE_KEY = "aiaas:theme";

interface StoredTheme {
  mode: ModeKey;
  accent: AccentKey;
}

interface ThemeState extends StoredTheme {
  setMode: (m: ModeKey) => void;
  setAccent: (a: AccentKey) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const DEFAULT_STATE: StoredTheme = {
  mode: DEFAULT_MODE,
  accent: DEFAULT_ACCENT,
};

const listeners = new Set<() => void>();

function readStored(): StoredTheme {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredTheme>;
    return {
      mode: MODE_KEYS.includes(parsed.mode as ModeKey)
        ? (parsed.mode as ModeKey)
        : DEFAULT_MODE,
      accent: ACCENT_KEYS.includes(parsed.accent as AccentKey)
        ? (parsed.accent as AccentKey)
        : DEFAULT_ACCENT,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

let snapshot: StoredTheme = DEFAULT_STATE;

function refreshSnapshot() {
  const next = readStored();
  if (next.mode !== snapshot.mode || next.accent !== snapshot.accent) {
    snapshot = next;
  }
}

function getSnapshot(): StoredTheme {
  return snapshot;
}

function getServerSnapshot(): StoredTheme {
  return DEFAULT_STATE;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      refreshSnapshot();
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: StoredTheme) {
  snapshot = next;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.mode = next.mode;
    document.documentElement.dataset.accent = next.accent;
    document.documentElement.style.colorScheme = next.mode;
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }
  emit();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    refreshSnapshot();
    persist(snapshot);
  }, []);

  const setMode = useCallback(
    (m: ModeKey) => persist({ ...snapshot, mode: m }),
    [],
  );
  const setAccent = useCallback(
    (a: AccentKey) => persist({ ...snapshot, accent: a }),
    [],
  );
  const cycle = useCallback(() => {
    const accent = nextAccent(snapshot.accent);
    const mode = accent === DEFAULT_ACCENT ? nextMode(snapshot.mode) : snapshot.mode;
    persist({ mode, accent });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode: state.mode,
        accent: state.accent,
        setMode,
        setAccent,
        cycle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
