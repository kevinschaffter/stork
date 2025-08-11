import { vi } from "vitest";

// Mock @react-native-async-storage/async-storage
export const mockAsyncStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  getAllKeys: vi.fn(),
  multiGet: vi.fn(),
  multiSet: vi.fn(),
  multiRemove: vi.fn(),
  mergeItem: vi.fn(),
  multiMerge: vi.fn(),
  flushGetRequests: vi.fn(),
};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: mockAsyncStorage,
}));

export const resetMocks = (): void => {
  Object.values(mockAsyncStorage).forEach((mock) => {
    mock.mockReset();
  });
};
