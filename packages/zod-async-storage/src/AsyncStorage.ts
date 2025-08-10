import AsyncStorageImpl from "@react-native-async-storage/async-storage";
import type { z } from "zod";

type GetItemOptions = Pick<GlobalOptions, "onFailure">;

type GlobalOptions = {
  strict?: boolean;
  onFailure?: "clear" | "throw";
  debug?: boolean;
};

type SchemaMap = Record<string, z.ZodType>;

type StrictKeyConstraint<TSchemas, UOptions extends GlobalOptions> = UOptions extends {
  strict: true;
}
  ? keyof TSchemas & string
  : (keyof TSchemas & string) | (string & {});

type InferredValue<TSchemas, UKey> = UKey extends keyof TSchemas
  ? z.infer<Extract<TSchemas[UKey], z.ZodType>>
  : string;

type AllKeysReturnType<TSchemas, UOptions extends GlobalOptions> = UOptions extends { strict: true }
  ? readonly (keyof TSchemas & string)[]
  : readonly string[];

// Helper type to map a tuple of keys to a tuple of [key, value | null] pairs
type MultiGetResult<
  TSchemas,
  TKeys extends (string & StrictKeyConstraint<TSchemas, GlobalOptions>)[],
> = {
  [K in keyof TKeys]: [TKeys[K], InferredValue<TSchemas, TKeys[K]> | null];
};

// Helper type for multiSet that enforces schema types for matching keys
type KeyValuePair<TSchemas, TKey> = TKey extends keyof TSchemas
  ? [TKey, z.infer<Extract<TSchemas[TKey], z.ZodType>>]
  : [TKey, string];

// Define a type-safe AsyncStorage builder
export function createAsyncStorage<
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions = { strict: true },
>(schemas: TSchemas, globalOptions?: UOptions) {
  const { onFailure = "clear", debug = false } = globalOptions || {};

  const logClearedInvalidItem = (key: string) => {
    if (debug) console.warn("Cleared invalid item", key);
  };

  const toError = (cause: unknown): Error =>
    cause instanceof Error ? cause : new Error(String(cause));

  const parseAndValidateValue = async <TKey extends string>(
    key: TKey,
    storedValue: string,
    failureMode: "clear" | "throw",
  ): Promise<InferredValue<TSchemas, TKey> | null> => {
    // Only parse JSON if we have a schema for this key
    if (key in schemas) {
      const schema = schemas[key];
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
    async getItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      key: TKey,
      options?: GetItemOptions,
      callback?: (error?: Error | null, result?: InferredValue<TSchemas, TKey> | null) => void,
    ): Promise<InferredValue<TSchemas, TKey> | null> {
      try {
        const storedValue = await AsyncStorageImpl.getItem(key);
        if (storedValue === null) {
          callback?.(null, null);
          return null;
        }

        const failureMode = options?.onFailure ?? onFailure;
        const data = await parseAndValidateValue(key, storedValue, failureMode);
        callback?.(null, data);
        return data;
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async setItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      key: TKey,
      value: InferredValue<TSchemas, TKey>,
      callback?: (error?: Error | null) => void,
    ): Promise<void> {
      try {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        await AsyncStorageImpl.setItem(key, stringValue);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async removeItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      key: TKey,
      callback?: (error?: Error | null) => void,
    ): Promise<void> {
      try {
        await AsyncStorageImpl.removeItem(key);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async clear(callback?: (error?: Error | null) => void): Promise<void> {
      try {
        await AsyncStorageImpl.clear();
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async getAllKeys(
      callback?: (
        error?: Error | null,
        result?: AllKeysReturnType<TSchemas, UOptions> | null,
      ) => void,
    ): Promise<AllKeysReturnType<TSchemas, UOptions>> {
      try {
        const keys = (await AsyncStorageImpl.getAllKeys()) as AllKeysReturnType<TSchemas, UOptions>;
        callback?.(null, keys);
        return keys;
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async multiGet<TKeys extends StrictKeyConstraint<TSchemas, UOptions>[]>(
      keys: [...TKeys],
      options?: GetItemOptions,
      callback?: (
        errors?: readonly (Error | null)[] | null,
        result?: MultiGetResult<TSchemas, TKeys> | null,
      ) => void,
    ): Promise<MultiGetResult<TSchemas, TKeys>> {
      try {
        const results = await AsyncStorageImpl.multiGet(keys);

        const mapped = (await Promise.all(
          results.map(async ([key, value], index) => {
            if (value === null) {
              return [keys[index], null] as const;
            }

            const failureMode = options?.onFailure ?? onFailure;
            const data = await parseAndValidateValue(key, value, failureMode);
            return [keys[index], data] as const;
          }),
        )) as MultiGetResult<TSchemas, TKeys>;

        callback?.(null, mapped);
        return mapped;
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    async multiSet<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      keyValuePairs: Array<KeyValuePair<TSchemas, TKey>>,
      callback?: (errors?: readonly (Error | null)[] | null) => void,
    ): Promise<void> {
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

    async multiRemove<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      keys: TKey[],
      callback?: (errors?: readonly (Error | null)[] | null) => void,
    ): Promise<void> {
      try {
        await AsyncStorageImpl.multiRemove(keys);
        callback?.(null);
      } catch (error) {
        callback?.([toError(error)]);
        throw error;
      }
    },

    async mergeItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      key: TKey,
      value: InferredValue<TSchemas, TKey>,
      callback?: (error?: Error | null) => void,
    ): Promise<void> {
      try {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        await AsyncStorageImpl.mergeItem(key, stringValue);
        callback?.(null);
      } catch (error) {
        callback?.(toError(error));
        throw error;
      }
    },

    async multiMerge<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
      keyValuePairs: Array<KeyValuePair<TSchemas, TKey>>,
      callback?: (errors?: readonly (Error | null)[] | null) => void,
    ): Promise<void> {
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

    flushGetRequests(): void {
      AsyncStorageImpl.flushGetRequests?.();
    },
  };
}
