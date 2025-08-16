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
  ? TSchemas[UKey] extends z.ZodType
    ? z.infer<TSchemas[UKey]>
    : never
  : string;

export type LocalStorageInstance<TSchemas extends SchemaMap, UOptions extends GlobalOptions> = {
  getItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    options?: GetItemOptions,
  ): InferredValue<TSchemas, TKey> | null;

  setItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(
    key: TKey,
    value: InferredValue<TSchemas, TKey>,
  ): void;

  removeItem<TKey extends StrictKeyConstraint<TSchemas, UOptions>>(key: TKey): void;

  clear(): void;

  key(index: number): string | null;

  readonly length: number;
};

export type LocalStorageHook<
  TSchemas extends SchemaMap,
  UOptions extends GlobalOptions,
  TKey extends StrictKeyConstraint<TSchemas, UOptions>,
> = {
  getItem: (options?: GetItemOptions) => InferredValue<TSchemas, TKey> | null;
  setItem: (value: InferredValue<TSchemas, TKey>) => void;
  removeItem: () => void;
};
