import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createAsyncStorage } from "../src/AsyncStorage";
import { createUseAsyncStorage } from "../src/hooks";
import { mockAsyncStorage, resetMocks } from "./setup";

describe("Integration Tests", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("End-to-end workflow", () => {
    it("should handle complete CRUD operations", async () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.email(),
        preferences: z.object({
          theme: z.enum(["light", "dark"]),
          notifications: z.boolean(),
        }),
      });

      const schemas = { user: userSchema };
      const storage = createAsyncStorage(schemas);
      const { useAsyncStorage } = createUseAsyncStorage(storage);
      const userHook = useAsyncStorage("user");

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
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(userData));
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      // Create
      await storage.setItem("user", userData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(userData));

      // Read via storage
      const retrieved = await storage.getItem("user");
      expect(retrieved).toEqual(userData);

      // Read via hook
      const hookRetrieved = await userHook.getItem();
      expect(hookRetrieved).toEqual(userData);

      // Update via hook
      const updatedData = { ...userData, name: "Jane Doe" };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(updatedData));
      await userHook.setItem(updatedData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(updatedData));

      // Delete
      await storage.removeItem("user");
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle batch operations", async () => {
      const schemas = {
        user: z.object({ id: z.number(), name: z.string() }),
        settings: z.object({ theme: z.enum(["light", "dark"]) }),
      };

      const storage = createAsyncStorage(schemas);

      const userData = { id: 1, name: "John" };
      const settingsData = { theme: "dark" as const };

      // Mock batch operations
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);
      mockAsyncStorage.multiGet.mockResolvedValue([
        ["user", JSON.stringify(userData)],
        ["settings", JSON.stringify(settingsData)],
      ]);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      // Batch set
      await storage.multiSet([
        ["user", userData],
        ["settings", settingsData],
      ]);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        ["user", JSON.stringify(userData)],
        ["settings", JSON.stringify(settingsData)],
      ]);

      // Batch get
      const results = await storage.multiGet(["user", "settings"]);
      expect(results).toEqual([
        ["user", userData],
        ["settings", settingsData],
      ]);

      // Batch remove
      await storage.multiRemove(["user", "settings"]);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(["user", "settings"]);
    });
  });

  describe("Error recovery scenarios", () => {
    it("should recover from corrupted data with clear strategy", async () => {
      const schemas = {
        user: z.object({ id: z.number(), name: z.string() }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });

      // Return corrupted data
      mockAsyncStorage.getItem.mockResolvedValue("corrupted json data");
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it("should handle validation errors with clear strategy", async () => {
      const schemas = {
        user: z.object({
          id: z.number(),
          email: z.email(),
        }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });
      const invalidData = { id: "not-a-number", email: "invalid-email" };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidData));
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle mixed success/failure in batch operations", async () => {
      const schemas = {
        user: z.object({ id: z.number() }),
        settings: z.object({ theme: z.string() }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "clear" });

      // One valid, one invalid
      mockAsyncStorage.multiGet.mockResolvedValue([
        ["user", JSON.stringify({ id: 1 })],
        ["settings", "invalid json"],
      ]);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const results = await storage.multiGet(["user", "settings"]);

      expect(results).toEqual([
        ["user", { id: 1 }],
        ["settings", null],
      ]);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("settings");
    });

    it("should throw errors for corrupted data with throw strategy", async () => {
      const schemas = {
        user: z.object({ id: z.number(), name: z.string() }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "throw" });

      // Return corrupted JSON data
      mockAsyncStorage.getItem.mockResolvedValue("corrupted json data");

      await expect(storage.getItem("user")).rejects.toThrow();
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it("should throw validation errors with throw strategy", async () => {
      const schemas = {
        user: z.object({
          id: z.number(),
          email: z.email(),
        }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "throw" });
      const invalidData = { id: "not-a-number", email: "invalid-email" };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidData));

      await expect(storage.getItem("user")).rejects.toThrow();
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it("should throw on first error in batch operations with throw strategy", async () => {
      const schemas = {
        user: z.object({ id: z.number() }),
        settings: z.object({ theme: z.string() }),
      };

      const storage = createAsyncStorage(schemas, { onFailure: "throw" });

      // One valid, one invalid
      mockAsyncStorage.multiGet.mockResolvedValue([
        ["user", JSON.stringify({ id: 1 })],
        ["settings", "invalid json"],
      ]);

      await expect(storage.multiGet(["user", "settings"])).rejects.toThrow();
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("Type safety validation", () => {
    it("should maintain type constraints in strict mode", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createAsyncStorage(schemas, { strict: true });
      const { useAsyncStorage } = createUseAsyncStorage(storage);

      // These should be accessible in strict mode
      const userHook = useAsyncStorage("user");
      expect(userHook).toBeDefined();

      // This would be a TypeScript error in strict mode (but we can't test compile-time errors)
      // const invalidHook = useAsyncStorage("nonExistentKey");
    });

    it("should allow arbitrary keys in non-strict mode", () => {
      const schemas = {
        user: z.object({ id: z.number() }),
      };

      const storage = createAsyncStorage(schemas, { strict: false });
      const { useAsyncStorage } = createUseAsyncStorage(storage);

      // These should work in non-strict mode
      const userHook = useAsyncStorage("user");
      const arbitraryHook = useAsyncStorage("arbitraryKey");

      expect(userHook).toBeDefined();
      expect(arbitraryHook).toBeDefined();
    });
  });

  describe("Performance and edge cases", () => {
    it("should handle large data objects", async () => {
      const largeArraySchema = z.array(
        z.object({
          id: z.number(),
          data: z.string(),
        }),
      );

      const schemas = { largeData: largeArraySchema };
      const storage = createAsyncStorage(schemas);

      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `Item ${i} with some data content`,
      }));

      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(largeData));

      await storage.setItem("largeData", largeData);
      const retrieved = await storage.getItem("largeData");

      expect(retrieved).toEqual(largeData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("largeData", JSON.stringify(largeData));
    });

    it("should handle deeply nested objects", async () => {
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
      const storage = createAsyncStorage(schemas);

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

      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(nestedData));

      await storage.setItem("nested", nestedData);
      const retrieved = await storage.getItem("nested");

      expect(retrieved).toEqual(nestedData);
    });

    it("should handle empty and null values correctly", async () => {
      const schemas = {
        optional: z.object({
          value: z.string().optional(),
          nullable: z.string().nullable(),
        }),
      };

      const storage = createAsyncStorage(schemas);

      const dataWithOptional = {
        value: undefined,
        nullable: null,
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(dataWithOptional));

      await storage.setItem("optional", dataWithOptional);
      const retrieved = await storage.getItem("optional");

      expect(retrieved).toEqual(dataWithOptional);
    });

    it("should handle concurrent operations", async () => {
      const schemas = {
        counter: z.object({ value: z.number() }),
      };

      const storage = createAsyncStorage(schemas);

      // Simulate concurrent reads
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ value: 42 }));

      const promises = Array.from({ length: 10 }, () => storage.getItem("counter"));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual({ value: 42 });
      });
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(10);
    });
  });

  describe("Schema evolution scenarios", () => {
    it("should handle schema changes with validation errors", async () => {
      // Simulate old data that doesn't match new schema
      const oldData = { name: "John", age: 30 }; // missing required 'email'
      const newSchema = z.object({
        name: z.string(),
        email: z.email(), // new required field
        age: z.number().optional(), // now optional
      });

      const schemas = { user: newSchema };
      const storage = createAsyncStorage(schemas, { onFailure: "clear" });

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(oldData));
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await storage.getItem("user");

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should handle backward compatible schema changes", async () => {
      // Old data should work with new schema that adds optional fields
      const oldData = { name: "John" };
      const newSchema = z.object({
        name: z.string(),
        email: z.string().optional(), // optional field
      });

      const schemas = { user: newSchema };
      const storage = createAsyncStorage(schemas);

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(oldData));

      const result = await storage.getItem("user");

      expect(result).toEqual(oldData);
    });
  });
});
