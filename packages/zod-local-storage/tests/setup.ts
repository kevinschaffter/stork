import { vi } from "vitest";

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  get length() {
    return Object.keys(this._storage).length;
  },
  _storage: {} as Record<string, string>,
};

// Override global localStorage
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

export const resetMocks = (): void => {
  mockLocalStorage.getItem.mockReset();
  mockLocalStorage.setItem.mockReset();
  mockLocalStorage.removeItem.mockReset();
  mockLocalStorage.clear.mockReset();
  mockLocalStorage.key.mockReset();
  mockLocalStorage._storage = {};
};
