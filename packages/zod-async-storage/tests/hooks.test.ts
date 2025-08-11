import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createAsyncStorage } from "../src/AsyncStorage";
import { createUseAsyncStorage } from "../src/hooks";
import { mockAsyncStorage, resetMocks } from "./setup";

describe("createUseAsyncStorage", () => {
  beforeEach(() => {
    resetMocks();
  });

  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  });

  const settingsSchema = z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
  });

  const schemas = {
    user: userSchema,
    settings: settingsSchema,
  };

  const sampleUser = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  };

  const sampleSettings = {
    theme: "dark" as const,
    notifications: true,
  };

  describe("hook creation", () => {
    it("should create useAsyncStorage hook factory", () => {
      const storage = createAsyncStorage(schemas);
      const { useAsyncStorage } = createUseAsyncStorage(storage);

      expect(typeof useAsyncStorage).toBe("function");
    });

    it("should create different hook instances for different keys", () => {
      const storage = createAsyncStorage(schemas);
      const { useAsyncStorage } = createUseAsyncStorage(storage);

      const userHook = useAsyncStorage("user");
      const settingsHook = useAsyncStorage("settings");

      expect(userHook).not.toBe(settingsHook);
      expect(typeof userHook.getItem).toBe("function");
      expect(typeof settingsHook.getItem).toBe("function");
    });
  });

  describe("useAsyncStorage hook methods", () => {
    let storage: ReturnType<typeof createAsyncStorage<typeof schemas>>;
    let useAsyncStorage: ReturnType<
      typeof createUseAsyncStorage<typeof schemas>
    >["useAsyncStorage"];

    beforeEach(() => {
      storage = createAsyncStorage(schemas);
      ({ useAsyncStorage } = createUseAsyncStorage(storage));
    });

    describe("getItem", () => {
      it("should call storage.getItem and return parsed result", async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));
        const userHook = useAsyncStorage("user");

        const result = await userHook.getItem();

        expect(result).toEqual(sampleUser);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("user");
      });

      it("should pass options through storage layer", async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));
        const userHook = useAsyncStorage("user");
        const options = { onFailure: "throw" as const };

        await userHook.getItem(options);

        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("user");
      });

      it("should handle callbacks through storage layer", async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await userHook.getItem(undefined, callback);

        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("user");
        expect(callback).toHaveBeenCalledWith(null, sampleUser);
      });

      it("should handle null return value", async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        const userHook = useAsyncStorage("user");

        const result = await userHook.getItem();

        expect(result).toBeNull();
      });

      it("should handle errors", async () => {
        const error = new Error("Storage error");
        mockAsyncStorage.getItem.mockRejectedValue(error);
        const userHook = useAsyncStorage("user");

        await expect(userHook.getItem()).rejects.toThrow("Storage error");
      });
    });

    describe("setItem", () => {
      it("should call storage.setItem with JSON stringified value", async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");

        await userHook.setItem(sampleUser);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
      });

      it("should handle callbacks", async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await userHook.setItem(sampleUser, callback);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
        expect(callback).toHaveBeenCalledWith(null);
      });

      it("should handle errors", async () => {
        const error = new Error("Storage error");
        mockAsyncStorage.setItem.mockRejectedValue(error);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await expect(userHook.setItem(sampleUser, callback)).rejects.toThrow("Storage error");
        expect(callback).toHaveBeenCalledWith(error);
      });

      it("should work with different schema types", async () => {
        mockAsyncStorage.setItem.mockResolvedValue(undefined);
        const settingsHook = useAsyncStorage("settings");

        await settingsHook.setItem(sampleSettings);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          "settings",
          JSON.stringify(sampleSettings),
        );
      });
    });

    describe("mergeItem", () => {
      it("should call storage.mergeItem with JSON stringified value", async () => {
        mockAsyncStorage.mergeItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");

        await userHook.mergeItem(sampleUser);

        expect(mockAsyncStorage.mergeItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
      });

      it("should handle callbacks", async () => {
        mockAsyncStorage.mergeItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await userHook.mergeItem(sampleUser, callback);

        expect(mockAsyncStorage.mergeItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
        expect(callback).toHaveBeenCalledWith(null);
      });

      it("should handle errors", async () => {
        const error = new Error("Storage error");
        mockAsyncStorage.mergeItem.mockRejectedValue(error);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await expect(userHook.mergeItem(sampleUser, callback)).rejects.toThrow("Storage error");
        expect(callback).toHaveBeenCalledWith(error);
      });
    });

    describe("removeItem", () => {
      it("should call storage.removeItem", async () => {
        mockAsyncStorage.removeItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");

        await userHook.removeItem();

        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
      });

      it("should handle callbacks", async () => {
        mockAsyncStorage.removeItem.mockResolvedValue(undefined);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await userHook.removeItem(callback);

        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
        expect(callback).toHaveBeenCalledWith(null);
      });

      it("should handle errors", async () => {
        const error = new Error("Storage error");
        mockAsyncStorage.removeItem.mockRejectedValue(error);
        const userHook = useAsyncStorage("user");
        const callback = vi.fn();

        await expect(userHook.removeItem(callback)).rejects.toThrow("Storage error");
        expect(callback).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("integration with storage layer", () => {
    it("should maintain type safety for schema keys", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      const { useAsyncStorage } = createUseAsyncStorage(storage);
      const userHook = useAsyncStorage("user");

      // Get should return the correct type
      const user = await userHook.getItem();
      expect(user).toEqual(sampleUser);

      // Set should accept the correct type
      await userHook.setItem(sampleUser);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
    });

    it("should handle different schema types correctly", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleSettings));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      const { useAsyncStorage } = createUseAsyncStorage(storage);
      const settingsHook = useAsyncStorage("settings");

      const settings = await settingsHook.getItem();
      expect(settings).toEqual(sampleSettings);

      await settingsHook.setItem(sampleSettings);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "settings",
        JSON.stringify(sampleSettings),
      );
    });
  });
});
