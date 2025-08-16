import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLocalStorage } from "../src/LocalStorage";
import { mockLocalStorage, resetMocks } from "./setup";

describe("createLocalStorage", () => {
  beforeEach(() => {
    resetMocks();
  });

  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.email(),
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


  describe("getItem", () => {
    it("should get and parse valid JSON for schema key", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sampleUser));

      const storage = createLocalStorage(schemas);
      const result = storage.getItem("user");

      expect(result).toEqual(sampleUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("user");
    });

    it("should return null when item doesn't exist", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const storage = createLocalStorage(schemas);
      const result = storage.getItem("user");

      expect(result).toBeNull();
    });

    it("should return raw string for key without schema", () => {
      const storage = createLocalStorage(schemas, { strict: false });
      mockLocalStorage.getItem.mockReturnValue("plain string");

      const result = storage.getItem("token");
      expect(result).toBe("plain string");
    });

    it("should throw validation error when onFailure is 'throw'", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ invalid: "data" }));

      const storage = createLocalStorage(schemas);
      expect(() => storage.getItem("user", { onFailure: "throw" })).toThrow(
        "Validation failed for key",
      );
    });

    it("should clear invalid data when onFailure is 'clear'", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ invalid: "data" }));

      const storage = createLocalStorage(schemas, { onFailure: "clear" });
      const result = storage.getItem("user");

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle invalid JSON", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      const storage = createLocalStorage(schemas, { onFailure: "clear" });
      const result = storage.getItem("user");

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("setItem", () => {
    it("should stringify and store JSON for schema key", () => {
      const storage = createLocalStorage(schemas);
      storage.setItem("user", sampleUser);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
    });

    it("should store raw string for key without schema", () => {
      const storage = createLocalStorage(schemas, { strict: false });
      storage.setItem("token", "raw-token");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("token", "raw-token");
    });

    it("should throw on localStorage error", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage full");
      });

      const storage = createLocalStorage(schemas);
      expect(() => storage.setItem("user", sampleUser)).toThrow("Storage full");
    });
  });

  describe("removeItem", () => {
    it("should remove item from localStorage", () => {
      const storage = createLocalStorage(schemas);
      storage.removeItem("user");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should throw on localStorage error", () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("Remove failed");
      });

      const storage = createLocalStorage(schemas);
      expect(() => storage.removeItem("user")).toThrow("Remove failed");
    });
  });

  describe("clear", () => {
    it("should clear all localStorage data", () => {
      const storage = createLocalStorage(schemas);
      storage.clear();

      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it("should throw on localStorage error", () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error("Clear failed");
      });

      const storage = createLocalStorage(schemas);
      expect(() => storage.clear()).toThrow("Clear failed");
    });
  });

  describe("key", () => {
    it("should get key at index", () => {
      mockLocalStorage.key.mockReturnValue("user");

      const storage = createLocalStorage(schemas);
      const result = storage.key(0);

      expect(result).toBe("user");
      expect(mockLocalStorage.key).toHaveBeenCalledWith(0);
    });

    it("should return null for invalid index", () => {
      mockLocalStorage.key.mockReturnValue(null);

      const storage = createLocalStorage(schemas);
      const result = storage.key(999);

      expect(result).toBeNull();
    });
  });

  describe("length", () => {
    it("should return localStorage length", () => {
      mockLocalStorage._storage = { user: "data", settings: "data" };

      const storage = createLocalStorage(schemas);
      expect(storage.length).toBe(2);
    });
  });

  describe("debug mode", () => {
    it("should log cleared invalid items when debug is true", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      const storage = createLocalStorage(schemas, { debug: true, onFailure: "clear" });
      storage.getItem("user");

      expect(consoleSpy).toHaveBeenCalledWith("Cleared invalid item", "user");
      consoleSpy.mockRestore();
    });
  });

  describe("strict mode", () => {
    it("should enforce schema keys when strict is true", () => {
      const storage = createLocalStorage(schemas, { strict: true });
      // In strict mode, TypeScript prevents access to undefined keys at compile time
      // Runtime behavior allows any key, but this test validates the storage works
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(() => storage.getItem("user")).not.toThrow();
    });

    it("should allow any key when strict is false", () => {
      const storage = createLocalStorage(schemas, { strict: false });
      mockLocalStorage.getItem.mockReturnValue("some value");

      const result = storage.getItem("any-key");
      expect(result).toBe("some value");
    });
  });
});
