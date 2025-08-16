import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createUseLocalStorage } from "../src/hooks";
import { createLocalStorage } from "../src/LocalStorage";
import { mockLocalStorage, resetMocks } from "./setup";

describe("Integration Tests", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("End-to-end workflow", () => {
    it("should handle complete CRUD operations", () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        preferences: z.object({
          theme: z.enum(["light", "dark"]),
          notifications: z.boolean(),
        }),
      });

      const schemas = { user: userSchema };
      const storage = createLocalStorage(schemas);
      const { useLocalStorage } = createUseLocalStorage(storage);
      const userHook = useLocalStorage("user");

      const userData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        preferences: {
          theme: "dark" as const,
          notifications: true,
        },
      };

      // Mock storage responses
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));

      // Create
      storage.setItem("user", userData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(userData));

      // Read via storage
      const retrieved = storage.getItem("user");
      expect(retrieved).toEqual(userData);

      // Read via hook
      const hookRetrieved = userHook.getItem();
      expect(hookRetrieved).toEqual(userData);

      // Update via hook
      const updatedData = { ...userData, name: "Jane Doe" };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(updatedData));
      userHook.setItem(updatedData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(updatedData));

      // Delete
      storage.removeItem("user");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("Error recovery scenarios", () => {
    it("should recover from corrupted data with clear strategy", () => {
      const schemas = {
        user: z.object({ id: z.number(), name: z.string() }),
      };

      const storage = createLocalStorage(schemas, { onFailure: "clear" });

      // Return corrupted data
      mockLocalStorage.getItem.mockReturnValue("corrupted json data");

      const result = storage.getItem("user");

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it("should handle validation errors with clear strategy", () => {
      const schemas = {
        user: z.object({
          id: z.number(),
          email: z.string().email(),
        }),
      };

      const storage = createLocalStorage(schemas, { onFailure: "clear" });
      const invalidData = { id: "not-a-number", email: "invalid-email" };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.getItem("user");

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should throw errors for corrupted data with throw strategy", () => {
      const schemas = {
        user: z.object({ id: z.number(), name: z.string() }),
      };

      const storage = createLocalStorage(schemas, { onFailure: "throw" });

      // Return corrupted JSON data
      mockLocalStorage.getItem.mockReturnValue("corrupted json data");

      expect(() => storage.getItem("user")).toThrow();
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it("should throw validation errors with throw strategy", () => {
      const schemas = {
        user: z.object({
          id: z.number(),
          email: z.string().email(),
        }),
      };

      const storage = createLocalStorage(schemas, { onFailure: "throw" });
      const invalidData = { id: "not-a-number", email: "invalid-email" };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      expect(() => storage.getItem("user")).toThrow();
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("Type safety validation", () => {
    it("should maintain type constraints in strict mode", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createLocalStorage(schemas, { strict: true });
      const { useLocalStorage } = createUseLocalStorage(storage);

      // These should be accessible in strict mode
      const userHook = useLocalStorage("user");
      expect(userHook).toBeDefined();

      // This would be a TypeScript error in strict mode (but we can't test compile-time errors)
      // const invalidHook = useLocalStorage("nonExistentKey");
    });

    it("should allow arbitrary keys in non-strict mode", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createLocalStorage(schemas, { strict: false });
      const { useLocalStorage } = createUseLocalStorage(storage);

      // These should work in non-strict mode
      const userHook = useLocalStorage("user");
      const arbitraryHook = useLocalStorage("arbitraryKey");

      expect(userHook).toBeDefined();
      expect(arbitraryHook).toBeDefined();
    });
  });

  describe("Performance and edge cases", () => {
    it("should handle large data objects", () => {
      const largeArraySchema = z.array(
        z.object({
          id: z.number(),
          data: z.string(),
        }),
      );

      const schemas = { largeData: largeArraySchema };
      const storage = createLocalStorage(schemas);

      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `Item ${i} with some data content`,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeData));

      storage.setItem("largeData", largeData);
      const retrieved = storage.getItem("largeData");

      expect(retrieved).toEqual(largeData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("largeData", JSON.stringify(largeData));
    });

    it("should handle deeply nested objects", () => {
      const nestedSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string(),
              array: z.array(
                z.object({
                  nested: z.boolean(),
                }),
              ),
            }),
          }),
        }),
      });

      const schemas = { nested: nestedSchema };
      const storage = createLocalStorage(schemas);

      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: "deep value",
              array: [{ nested: true }, { nested: false }],
            },
          },
        },
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(nestedData));

      storage.setItem("nested", nestedData);
      const retrieved = storage.getItem("nested");

      expect(retrieved).toEqual(nestedData);
    });

    it("should handle empty and null values correctly", () => {
      const schemas = {
        optional: z.object({
          value: z.string().optional(),
          nullable: z.string().nullable(),
        }),
      };

      const storage = createLocalStorage(schemas);

      const dataWithOptional = {
        value: undefined,
        nullable: null,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(dataWithOptional));

      storage.setItem("optional", dataWithOptional);
      const retrieved = storage.getItem("optional");

      expect(retrieved).toEqual(dataWithOptional);
    });

    it("should handle localStorage key/length operations", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createLocalStorage(schemas);

      // Test key method
      mockLocalStorage.key.mockReturnValue("user");
      expect(storage.key(0)).toBe("user");

      // Test length property
      mockLocalStorage._storage = { user: "data", settings: "data" };
      expect(storage.length).toBe(2);
    });
  });

  describe("Schema evolution scenarios", () => {
    it("should handle schema changes with validation errors", () => {
      // Simulate old data that doesn't match new schema
      const oldData = { name: "John", age: 30 }; // missing required 'email'
      const newSchema = z.object({
        name: z.string(),
        email: z.string().email(), // new required field
        age: z.number().optional(), // now optional
      });

      const schemas = { user: newSchema };
      const storage = createLocalStorage(schemas, { onFailure: "clear" });

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldData));

      const result = storage.getItem("user");

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle backward compatible schema changes", () => {
      // Old data should work with new schema that adds optional fields
      const oldData = { name: "John" };
      const newSchema = z.object({
        name: z.string(),
        email: z.string().optional(), // optional field
      });

      const schemas = { user: newSchema };
      const storage = createLocalStorage(schemas);

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldData));

      const result = storage.getItem("user");

      expect(result).toEqual(oldData);
    });
  });

  describe("localStorage-specific scenarios", () => {
    it("should handle localStorage quota exceeded errors", () => {
      const schemas = {
        data: z.object({ content: z.string() }),
      };

      const storage = createLocalStorage(schemas);

      // Mock quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      const largeData = { content: "x".repeat(10000) };

      expect(() => storage.setItem("data", largeData)).toThrow("QuotaExceededError");
    });

    it("should handle localStorage being disabled", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createLocalStorage(schemas);

      // Mock localStorage being disabled
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage is not available");
      });

      expect(() => storage.getItem("user")).toThrow("localStorage is not available");
    });

    it("should work with raw string keys in non-strict mode", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createLocalStorage(schemas, { strict: false });

      // Store and retrieve raw string
      mockLocalStorage.getItem.mockReturnValue("plain string value");

      storage.setItem("plainKey", "plain string value");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("plainKey", "plain string value");

      const result = storage.getItem("plainKey");
      expect(result).toBe("plain string value");
    });
  });
});
