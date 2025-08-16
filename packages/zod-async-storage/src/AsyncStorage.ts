import AsyncStorageImpl from "@react-native-async-storage/async-storage";
import type { z } from "zod";
import type {
  AllKeysReturnType,
  AsyncStorageInstance,
  GlobalOptions,
  InferredValue,
  MultiGetResult,
  SchemaMap,
} from "./types";

// Define a type-safe AsyncStorage builder
export function createAsyncStorage<
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions = { strict: true },
>(schemas: TSchemas, globalOptions?: UOptions): AsyncStorageInstance<TSchemas, UOptions> {
  const { onFailure = "clear", debug = false, onValidationError } = globalOptions || {};

  const logClearedInvalidItem = (key: string) => {
    if (debug) console.warn("Cleared invalid item", key);
  };

  const toError = (cause: unknown): Error =>
    cause instanceof Error ? cause : new Error(String(cause));

  const parseAndValidateValue = async <TKey extends string>(
    key: TKey,
    storedValue: string,
    failureMode: "clear" | "throw",
    validationErrorCallback?: (key: string, error: z.ZodError, value: unknown) => void,
  ): Promise<InferredValue<TSchemas, TKey> | null> => {
    // Only parse JSON if we have a schema for this key
    if (key in schemas) {
      const schema = schemas[key];
      // TypeScript requires this check even though logically schema cannot be undefined
      if (schema) {
        let parsedValue: unknown;
        try {
          parsedValue = JSON.parse(storedValue);
        } catch (error) {
          if (error instanceof SyntaxError) {
            if (failureMode === "clear") {
              await AsyncStorageImpl.removeItem(key);
              logClearedInvalidItem(key);
              return null;
            }
            throw new Error(`Invalid JSON for key "${key}": ${error.message}`);
          }
          throw error;
        }

        const result = schema.safeParse(parsedValue);

        if (!result.success) {
          validationErrorCallback?.(key, result.error, parsedValue);

          if (failureMode === "clear") {
            await AsyncStorageImpl.removeItem(key);
            logClearedInvalidItem(key);
            return null;
          }
          throw new Error(`Validation failed for key "${key}": ${result.error.message}`);
        }

        return result.data as InferredValue<TSchemas, TKey>;
      }
    }

    // For keys without schemas, return the raw string value
    return storedValue as InferredValue<TSchemas, TKey>;
  };

  return {
    async getItem(key, options, callback) {
      try {
        const storedValue = await AsyncStorageImpl.getItem(key);
        if (storedValue === null) {
          callback?.(null, null);
          return null;
        }

        const failureMode = options?.onFailure ?? onFailure;
        const validationErrorCallback = options?.onValidationError ?? onValidationError;
        const data = await parseAndValidateValue(
          key,
          storedValue,
          failureMode,
          validationErrorCallback,
        );
        callback?.(null, data);
        return data;
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async setItem(key, value, callback) {
      try {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        await AsyncStorageImpl.setItem(key, stringValue);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async removeItem(key, callback) {
      try {
        await AsyncStorageImpl.removeItem(key);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async clear(callback) {
      try {
        await AsyncStorageImpl.clear();
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async getAllKeys(callback) {
      try {
        const keys = (await AsyncStorageImpl.getAllKeys()) as AllKeysReturnType<TSchemas, UOptions>;
        callback?.(null, keys);
        return keys;
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async multiGet(keys, options, callback) {
      try {
        const results = await AsyncStorageImpl.multiGet(keys);

        const mapped = (await Promise.all(
          results.map(async ([key, value], index) => {
            if (value === null) {
              return [keys[index], null];
            }

            const failureMode = options?.onFailure ?? onFailure;
            const validationErrorCallback = options?.onValidationError ?? onValidationError;
            const data = await parseAndValidateValue(
              key,
              value,
              failureMode,
              validationErrorCallback,
            );
            return [keys[index], data];
          }),
        )) as MultiGetResult<TSchemas, typeof keys>;

        callback?.(null, mapped);
        return mapped;
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    async multiSet(keyValuePairs, callback) {
      // Convert values to JSON strings for AsyncStorage
      const stringifiedPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        return [key, stringValue];
      });
      try {
        await AsyncStorageImpl.multiSet(stringifiedPairs);
        callback?.(null);
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    async multiRemove(keys, callback) {
      try {
        await AsyncStorageImpl.multiRemove(keys);
        callback?.(null);
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    async mergeItem(key, value, callback) {
      try {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        await AsyncStorageImpl.mergeItem(key, stringValue);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async multiMerge(keyValuePairs, callback) {
      const stringifiedPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        return [key, stringValue];
      });
      try {
        await AsyncStorageImpl.multiMerge(stringifiedPairs);
        callback?.(null);
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    flushGetRequests() {
      AsyncStorageImpl.flushGetRequests?.();
    },
  };
}
