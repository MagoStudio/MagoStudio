export type RelaxedLimitWindow = "daily" | "weekly";

type HitState = Partial<Record<RelaxedLimitWindow, number>>;

let hitResetAt: HitState = {};
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const relaxedLimitStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: (): HitState => hitResetAt,
  markHit: (window: RelaxedLimitWindow, resetAtSeconds: number | undefined) => {
    hitResetAt = { ...hitResetAt, [window]: resetAtSeconds ?? 0 };
    emit();
  },
  clear: (window: RelaxedLimitWindow) => {
    if (hitResetAt[window] === undefined) return;
    const next = { ...hitResetAt };
    delete next[window];
    hitResetAt = next;
    emit();
  }
};
