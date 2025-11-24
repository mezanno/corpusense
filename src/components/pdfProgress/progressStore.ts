let value = 0;
const listeners = new Set<() => void>();

export const pdfProgressStore = {
  set(newValue: number) {
    value = newValue;
    listeners.forEach((l) => l());
  },
  get() {
    return value;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  reset() {
    value = 0;
    listeners.forEach((l) => l());
  },
};

export default pdfProgressStore;
