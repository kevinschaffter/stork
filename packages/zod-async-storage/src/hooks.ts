import type { createAsyncStorage } from "./AsyncStorage";
import type { AsyncStorageHook, GlobalOptions, SchemaMap, StrictKeyConstraint } from "./types";

export const createUseAsyncStorage = <
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions = { strict: true },
>(
  storage: ReturnType<typeof createAsyncStorage<TSchemas, UOptions>>,
) => {
  const useAsyncStorage = <TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
  ): AsyncStorageHook<TSchemas, UOptions, TKey> => ({
    getItem: (options, callback) => storage.getItem(key, options, callback),
    setItem: (value, callback) => storage.setItem(key, value, callback),
    mergeItem: (value, callback) => storage.mergeItem(key, value, callback),
    removeItem: (callback) => storage.removeItem(key, callback),
  });
  return { useAsyncStorage };
};
