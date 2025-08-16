import type { createLocalStorage } from "./LocalStorage";
import type { GlobalOptions, LocalStorageHook, SchemaMap, StrictKeyConstraint } from "./types";

export const createUseLocalStorage = <
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions = { strict: true },
>(
  storage: ReturnType<typeof createLocalStorage<TSchemas, UOptions>>,
) => {
  const useLocalStorage = <TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
  ): LocalStorageHook<TSchemas, UOptions, TKey> => ({
    getItem: (options) => storage.getItem(key, options),
    setItem: (value) => storage.setItem(key, value),
    removeItem: () => storage.removeItem(key),
  });
  return { useLocalStorage };
};
