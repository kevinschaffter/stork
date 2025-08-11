import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createAsyncStorage } from "../src/AsyncStorage";
import { mockAsyncStorage, resetMocks } from "./setup";

describe("createAsyncStorage", () => {
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

  const sampleSettings: { theme: "light" | "dark"; notifications: boolean } = {
    theme: "dark",
    notifications: true,
  };

  describe("getItem", () => {
    it("should get and parse valid JSON for schema key", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));

      const storage = createAsyncStorage(schemas);
      const result = await storage.getItem("user");

      expect(result).toEqual(sampleUser);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("user");
    });

    it("should return null when item doesn't exist", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const storage = createAsyncStorage(schemas);
      const result = await storage.getItem("user");

      expect(result).toBeNull();
    });

    it("should return raw string for non-schema key in non-strict mode", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("raw string value");

      const storage = createAsyncStorage(schemas, { strict: false });
      const result = await storage.getItem("nonSchemaKey");

      expect(result).toBe("raw string value");
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleUser));
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.getItem("user", undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, sampleUser);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.getItem.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.getItem("user", undefined, callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith(error);
    });

    it("should clear invalid JSON and return null with onFailure: clear", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });
      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should throw on invalid JSON with onFailure: throw", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");

      const storage = createAsyncStorage(schemas, { onFailure: "throw" });

      await expect(storage.getItem("user")).rejects.toThrow("Invalid JSON");
    });

    it("should clear invalid schema data and return null with onFailure: clear", async () => {
      const invalidUser = { id: "invalid", name: 123, email: "not-email" };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidUser));
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });
      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should throw on invalid schema data with onFailure: throw", async () => {
      const invalidUser = { id: "invalid", name: 123, email: "not-email" };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidUser));

      const storage = createAsyncStorage(schemas, { onFailure: "throw" });

      await expect(storage.getItem("user")).rejects.toThrow("Validation failed");
    });

    it("should use options.onFailure over global onFailure", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });

      await expect(storage.getItem("user", { onFailure: "throw" })).rejects.toThrow("Invalid JSON");
    });
  });

  describe("setItem", () => {
    it("should stringify and set item for schema key", async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.setItem("user", sampleUser);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
    });

    it("should set raw string for non-schema key in non-strict mode", async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { strict: false });
      await storage.setItem("nonSchemaKey", "raw value");

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("nonSchemaKey", "raw value");
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.setItem("user", sampleUser, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.setItem.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.setItem("user", sampleUser, callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe("removeItem", () => {
    it("should remove item", async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.removeItem("user");

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.removeItem("user", callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.removeItem.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.removeItem("user", callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe("clear", () => {
    it("should clear all storage", async () => {
      mockAsyncStorage.clear.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.clear();

      expect(mockAsyncStorage.clear).toHaveBeenCalled();
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.clear.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.clear(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.clear.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.clear(callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe("getAllKeys", () => {
    it("should get all keys", async () => {
      const keys = ["user", "settings", "other"];
      mockAsyncStorage.getAllKeys.mockResolvedValue(keys);

      const storage = createAsyncStorage(schemas);
      const result = await storage.getAllKeys();

      expect(result).toEqual(keys);
      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
    });

    it("should call callback on success", async () => {
      const keys = ["user", "settings"];
      mockAsyncStorage.getAllKeys.mockResolvedValue(keys);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.getAllKeys(callback);

      expect(callback).toHaveBeenCalledWith(null, keys);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.getAllKeys.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.getAllKeys(callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe("multiGet", () => {
    it("should get multiple items and parse them", async () => {
      const keys = ["user" as const, "settings" as const];
      const mockResults = [
        ["user", JSON.stringify(sampleUser)],
        ["settings", JSON.stringify(sampleSettings)],
      ];
      mockAsyncStorage.multiGet.mockResolvedValue(mockResults);

      const storage = createAsyncStorage(schemas);
      const result = await storage.multiGet(keys);

      expect(result).toEqual([
        ["user", sampleUser],
        ["settings", sampleSettings],
      ]);
      expect(mockAsyncStorage.multiGet).toHaveBeenCalledWith(keys);
    });

    it("should handle null values", async () => {
      const keys = ["user" as const, "settings" as const];
      const mockResults = [
        ["user", null],
        ["settings", JSON.stringify(sampleSettings)],
      ];
      mockAsyncStorage.multiGet.mockResolvedValue(mockResults);

      const storage = createAsyncStorage(schemas);
      const result = await storage.multiGet(keys);

      expect(result).toEqual([
        ["user", null],
        ["settings", sampleSettings],
      ]);
    });

    it("should call callback on success", async () => {
      const mockResults = [["user", JSON.stringify(sampleUser)]];
      mockAsyncStorage.multiGet.mockResolvedValue(mockResults);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.multiGet(["user"], undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, [["user", sampleUser]]);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.multiGet.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.multiGet(["user"], undefined, callback)).rejects.toThrow(
        "Storage error",
      );
      expect(callback).toHaveBeenCalledWith([error]);
    });

    it("should use options.onFailure for invalid data", async () => {
      const mockResults = [["user", "invalid json"]];
      mockAsyncStorage.multiGet.mockResolvedValue(mockResults);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      const result = await storage.multiGet(["user"], { onFailure: "clear" });

      expect(result).toEqual([["user", null]]);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("multiSet", () => {
    it("should set multiple items with JSON stringification", async () => {
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.multiSet([
        ["user", sampleUser],
        ["settings", sampleSettings],
      ]);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        ["user", JSON.stringify(sampleUser)],
        ["settings", JSON.stringify(sampleSettings)],
      ]);
    });

    it("should handle raw strings for non-schema keys in non-strict mode", async () => {
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { strict: false });
      await storage.multiSet([
        ["user", sampleUser],
        ["nonSchemaKey", "raw value"],
      ]);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        ["user", JSON.stringify(sampleUser)],
        ["nonSchemaKey", "raw value"],
      ]);
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.multiSet([["user", sampleUser]], callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.multiSet.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.multiSet([["user", sampleUser]], callback)).rejects.toThrow(
        "Storage error",
      );
      expect(callback).toHaveBeenCalledWith([error]);
    });
  });

  describe("multiRemove", () => {
    it("should remove multiple items", async () => {
      const keys = ["user" as const, "settings" as const];
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.multiRemove(keys);

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(keys);
    });

    it("should call callback on success", async () => {
      const keys = ["user" as const];
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.multiRemove(keys, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.multiRemove.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.multiRemove(["user"], callback)).rejects.toThrow("Storage error");
      expect(callback).toHaveBeenCalledWith([error]);
    });
  });

  describe("mergeItem", () => {
    it("should merge item with JSON stringification", async () => {
      mockAsyncStorage.mergeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.mergeItem("user", sampleUser);

      expect(mockAsyncStorage.mergeItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
    });

    it("should handle raw strings for non-schema keys in non-strict mode", async () => {
      mockAsyncStorage.mergeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { strict: false });
      await storage.mergeItem("nonSchemaKey", "raw value");

      expect(mockAsyncStorage.mergeItem).toHaveBeenCalledWith("nonSchemaKey", "raw value");
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.mergeItem.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.mergeItem("user", sampleUser, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.mergeItem.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.mergeItem("user", sampleUser, callback)).rejects.toThrow(
        "Storage error",
      );
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe("multiMerge", () => {
    it("should merge multiple items with JSON stringification", async () => {
      mockAsyncStorage.multiMerge.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.multiMerge([
        ["user", sampleUser],
        ["settings", sampleSettings],
      ]);

      expect(mockAsyncStorage.multiMerge).toHaveBeenCalledWith([
        ["user", JSON.stringify(sampleUser)],
        ["settings", JSON.stringify(sampleSettings)],
      ]);
    });

    it("should call callback on success", async () => {
      mockAsyncStorage.multiMerge.mockResolvedValue(undefined);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);
      await storage.multiMerge([["user", sampleUser]], callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should call callback on error", async () => {
      const error = new Error("Storage error");
      mockAsyncStorage.multiMerge.mockRejectedValue(error);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.multiMerge([["user", sampleUser]], callback)).rejects.toThrow(
        "Storage error",
      );
      expect(callback).toHaveBeenCalledWith([error]);
    });
  });

  describe("flushGetRequests", () => {
    it("should call underlying flushGetRequests", () => {
      const storage = createAsyncStorage(schemas);
      storage.flushGetRequests();

      expect(mockAsyncStorage.flushGetRequests).toHaveBeenCalled();
    });
  });

  describe("debug logging", () => {
    it("should log cleared items when debug is enabled", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { onFailure: "clear", debug: true });
      await storage.getItem("user");

      expect(consoleSpy).toHaveBeenCalledWith("Cleared invalid item", "user");
      consoleSpy.mockRestore();
    });

    it("should not log when debug is disabled", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas, { onFailure: "clear", debug: false });
      await storage.getItem("user");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("should convert non-Error objects to Error instances", async () => {
      mockAsyncStorage.getItem.mockRejectedValue("string error");
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.getItem("user", undefined, callback)).rejects.toThrow("string error");
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should preserve Error instances", async () => {
      const originalError = new Error("original error");
      mockAsyncStorage.getItem.mockRejectedValue(originalError);
      const callback = vi.fn();

      const storage = createAsyncStorage(schemas);

      await expect(storage.getItem("user", undefined, callback)).rejects.toThrow("original error");
      expect(callback).toHaveBeenCalledWith(originalError);
    });
  });

  describe("global options", () => {
    it("should default to onFailure: clear", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });

    it("should default to debug: false", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockAsyncStorage.getItem.mockResolvedValue("invalid json");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const storage = createAsyncStorage(schemas);
      await storage.getItem("user");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
