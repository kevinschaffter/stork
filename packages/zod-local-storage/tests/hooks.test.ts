import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createUseLocalStorage } from "../src/hooks";
import { createLocalStorage } from "../src/LocalStorage";
import { mockLocalStorage, resetMocks } from "./setup";

describe("createUseLocalStorage", () => {
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

  const sampleSettings = {
    theme: "dark" as const,
    notifications: true,
  };

  describe("hook creation", () => {
    it("should create useLocalStorage hook factory", () => {
      const storage = createLocalStorage(schemas);
      const { useLocalStorage } = createUseLocalStorage(storage);

      expect(typeof useLocalStorage).toBe("function");
    });

    it("should create different hook instances for different keys", () => {
      const storage = createLocalStorage(schemas);
      const { useLocalStorage } = createUseLocalStorage(storage);

      const userHook = useLocalStorage("user");
      const settingsHook = useLocalStorage("settings");

      expect(userHook).not.toBe(settingsHook);
      expect(typeof userHook.getItem).toBe("function");
      expect(typeof settingsHook.getItem).toBe("function");
    });
  });

  describe("useLocalStorage hook methods", () => {
    let storage: ReturnType<typeof createLocalStorage<typeof schemas>>;
    let useLocalStorage: ReturnType<
      typeof createUseLocalStorage<typeof schemas>
    >["useLocalStorage"];

    beforeEach(() => {
      storage = createLocalStorage(schemas);
      ({ useLocalStorage } = createUseLocalStorage(storage));
    });

    describe("getItem", () => {
      it("should call storage.getItem and return parsed result", () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sampleUser));
        const userHook = useLocalStorage("user");

        const result = userHook.getItem();

        expect(result).toEqual(sampleUser);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("user");
      });

      it("should pass options through storage layer", () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sampleUser));
        const userHook = useLocalStorage("user");
        const options = { onFailure: "throw" as const };

        userHook.getItem(options);

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("user");
      });

      it("should handle null return value", () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const userHook = useLocalStorage("user");

        const result = userHook.getItem();

        expect(result).toBeNull();
      });

      it("should handle errors", () => {
        const error = new Error("Storage error");
        mockLocalStorage.getItem.mockImplementation(() => {
          throw error;
        });
        const userHook = useLocalStorage("user");

        expect(() => userHook.getItem()).toThrow("Storage error");
      });
    });

    describe("setItem", () => {
      it("should call storage.setItem with JSON stringified value", () => {
        const userHook = useLocalStorage("user");

        userHook.setItem(sampleUser);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
      });

      it("should handle errors", () => {
        const error = new Error("Storage error");
        mockLocalStorage.setItem.mockImplementation(() => {
          throw error;
        });
        const userHook = useLocalStorage("user");

        expect(() => userHook.setItem(sampleUser)).toThrow("Storage error");
      });

      it("should work with different schema types", () => {
        const settingsHook = useLocalStorage("settings");

        settingsHook.setItem(sampleSettings);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "settings",
          JSON.stringify(sampleSettings),
        );
      });
    });

    describe("removeItem", () => {
      it("should call storage.removeItem", () => {
        const userHook = useLocalStorage("user");

        userHook.removeItem();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
      });

      it("should handle errors", () => {
        const error = new Error("Storage error");
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw error;
        });
        const userHook = useLocalStorage("user");

        expect(() => userHook.removeItem()).toThrow("Storage error");
      });
    });
  });

  describe("integration with storage layer", () => {
    it("should maintain type safety for schema keys", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sampleUser));

      const storage = createLocalStorage(schemas);
      const { useLocalStorage } = createUseLocalStorage(storage);
      const userHook = useLocalStorage("user");

      // Get should return the correct type
      const user = userHook.getItem();
      expect(user).toEqual(sampleUser);

      // Set should accept the correct type
      userHook.setItem(sampleUser);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(sampleUser));
    });

    it("should handle different schema types correctly", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sampleSettings));

      const storage = createLocalStorage(schemas);
      const { useLocalStorage } = createUseLocalStorage(storage);
      const settingsHook = useLocalStorage("settings");

      const settings = settingsHook.getItem();
      expect(settings).toEqual(sampleSettings);

      settingsHook.setItem(sampleSettings);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "settings",
        JSON.stringify(sampleSettings),
      );
    });
  });
});
