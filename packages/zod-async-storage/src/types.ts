import type { z } from "zod";

export type GetItemOptions = Pick<GlobalOptions, "onFailure" | "onValidationError">;

export type GlobalOptions = {
  strict?: boolean;
  onFailure?: "clear" | "throw";
  debug?: boolean;
  onValidationError?: (key: string, error: z.ZodError, value: unknown) => void;
};

export type SchemaMap = Record<string, z.ZodType>;

export type StrictKeyConstraint<TSchemas, UOptions extends GlobalOptions> = UOptions extends {
  strict: true;
}
  ? keyof TSchemas & string
  : (keyof TSchemas & string) | (string & {});

export type InferredValue<TSchemas, UKey> = UKey extends keyof TSchemas
  ? z.infer<TSchemas[UKey]>
  : string;

export type AllKeysReturnType<TSchemas, UOptions extends GlobalOptions> = UOptions extends {
  strict: true;
}
  ? readonly (keyof TSchemas & string)[]
  : readonly string[];

export type MultiGetResult<
  TSchemas,
  TKeys extends (string & StrictKeyConstraint<TSchemas, GlobalOptions>)[],
> = {
  [K in keyof TKeys]: [TKeys[K], InferredValue<TSchemas, TKeys[K]> | null];
};

export type KeyValuePair<TSchemas, TKey> = TKey extends keyof TSchemas
  ? [TKey, z.infer<Extract<TSchemas[TKey], z.ZodType>>]
  : [TKey, string];

export type AsyncStorageInstance<TSchemas extends SchemaMap, UOptions extends GlobalOptions> = {
  getItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    options?: GetItemOptions,
    callback?: (error?: Error | null, result?: InferredValue<TSchemas, TKey> | null) => void,
  ): Promise<InferredValue<TSchemas, TKey> | null>;

  setItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    value: InferredValue<TSchemas, TKey>,
    callback?: (error?: Error | null) => void,
  ): Promise<void>;

  removeItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    callback?: (error?: Error | null) => void,
  ): Promise<void>;

  clear(callback?: (error?: Error | null) => void): Promise<void>;

  getAllKeys(
    callback?: (
      error?: Error | null,
      result?: AllKeysReturnType<TSchemas, UOptions> | null,
    ) => void,
  ): Promise<AllKeysReturnType<TSchemas, UOptions>>;

  multiGet<TKeys extends StrictKeyConstraint<TSchemas, UOptions>[]>(
    keys: [...TKeys],
    options?: GetItemOptions,
    callback?: (
      errors?: readonly (Error | null)[] | null,
      result?: MultiGetResult<TSchemas, TKeys> | null,
    ) => void,
  ): Promise<MultiGetResult<TSchemas, TKeys>>;

  multiSet<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    keyValuePairs: Array<KeyValuePair<TSchemas, TKey>>,
    callback?: (errors?: readonly (Error | null)[] | null) => void,
  ): Promise<void>;

  multiRemove<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    keys: TKey[],
    callback?: (errors?: readonly (Error | null)[] | null) => void,
  ): Promise<void>;

  mergeItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    value: InferredValue<TSchemas, TKey>,
    callback?: (error?: Error | null) => void,
  ): Promise<void>;

  multiMerge<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    keyValuePairs: Array<KeyValuePair<TSchemas, TKey>>,
    callback?: (errors?: readonly (Error | null)[] | null) => void,
  ): Promise<void>;

  flushGetRequests(): void;
};

export type AsyncStorageHook<
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions,
  TKey extends StrictKeyConstraint<TSchemas, UOptions>,
> = {
  getItem: (
    options?: GetItemOptions,
    callback?: (error?: Error | null, result?: InferredValue<TSchemas, TKey> | null) => void,
  ) => Promise<InferredValue<TSchemas, TKey> | null>;
  setItem: (
    value: InferredValue<TSchemas, TKey>,
    callback?: (error?: Error | null) => void,
  ) => Promise<void>;
  mergeItem: (
    value: InferredValue<TSchemas, TKey>,
    callback?: (error?: Error | null) => void,
  ) => Promise<void>;
  removeItem: (callback?: (error?: Error | null) => void) => Promise<void>;
};
