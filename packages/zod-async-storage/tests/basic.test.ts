import * as RNAsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createAsyncStorage } from "../src";

vi.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string | null>();
  return {
    default: {
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      getAllKeys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
      multiGet: vi.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store.get(k) ?? null] as const)),
      ),
      multiSet: vi.fn((pairs: Array<[string, string]>) => {
        for (const [k, v] of pairs) store.set(k, v);
        return Promise.resolve();
      }),
      multiRemove: vi.fn((keys: string[]) => {
        for (const k of keys) store.delete(k);
        return Promise.resolve();
      }),
      mergeItem: vi.fn(() => Promise.resolve()),
      multiMerge: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      flushGetRequests: vi.fn(),
    },
  };
});

describe("createAsyncStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores and retrieves typed values", async () => {
    const schemas = { user: z.object({ id: z.string() }) };
    const storage = createAsyncStorage(schemas, { strict: true });

    await storage.setItem("user", { id: "1" });
    const u = await storage.getItem("user");
    expect(u).toEqual({ id: "1" });
  });

  it("clears invalid json on get when configured", async () => {
    const schemas = { user: z.object({ id: z.string() }) };
    const storage = createAsyncStorage(schemas, {
      strict: true,
      onFailure: "clear",
    });

    // simulate invalid json via the mocked async storage
    const mocked = RNAsyncStorage as unknown as {
      default: { setItem: (key: string, value: string) => Promise<void> };
    };
    await mocked.default.setItem("user", "{invalid");
    const u = await storage.getItem("user");
    expect(u).toBeNull();
  });
});
