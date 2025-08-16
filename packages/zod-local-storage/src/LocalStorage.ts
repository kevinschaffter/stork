import type { z } from "zod";
import type { GlobalOptions, InferredValue, LocalStorageInstance, SchemaMap } from "./types";

export function createLocalStorage<
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions = { strict: true },
>(schemas: TSchemas, globalOptions?: UOptions): LocalStorageInstance<TSchemas, UOptions> {
  const { onFailure = "clear", debug = false, onValidationError } = globalOptions || {};

  const logClearedInvalidItem = (key: string) => {
    if (debug) console.warn("Cleared invalid item", key);
  };

  const toError = (cause: unknown): Error =>
    cause instanceof Error ? cause : new Error(String(cause));

  const parseAndValidateValue = <TKey extends string>(
    key: TKey,
    storedValue: string,
    failureMode: "clear" | "throw",
    validationErrorCallback?: (key: string, error: z.ZodError, value: unknown) => void,
  ): InferredValue<TSchemas, TKey> | null => {
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
              localStorage.removeItem(key);
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
            localStorage.removeItem(key);
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
    getItem(key, options) {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) {
          return null;
        }

        const failureMode = options?.onFailure ?? onFailure;
        const validationErrorCallback = options?.onValidationError ?? onValidationError;
        return parseAndValidateValue(key, storedValue, failureMode, validationErrorCallback);
      } catch (error) {
        throw toError(error);
      }
    },

    setItem(key, value) {
      try {
        const stringValue = key in schemas ? JSON.stringify(value) : (value as string);
        localStorage.setItem(key, stringValue);
      } catch (error) {
        throw toError(error);
      }
    },

    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        throw toError(error);
      }
    },

    clear() {
      try {
        localStorage.clear();
      } catch (error) {
        throw toError(error);
      }
    },

    key(index) {
      try {
        return localStorage.key(index);
      } catch (error) {
        throw toError(error);
      }
    },

    get length() {
      try {
        return localStorage.length;
      } catch (error) {
        throw toError(error);
      }
    },
  };
}
