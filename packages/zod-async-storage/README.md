# zod-async-storage

[![npm version](https://img.shields.io/npm/v/zod-async-storage.svg)](https://www.npmjs.com/package/zod-async-storage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A **type-safe** and **validated** wrapper around `@react-native-async-storage/async-storage` using Zod schemas. Enjoy the benefits of runtime validation, automatic type inference, and better developer experience when working with AsyncStorage in React Native and Expo applications.

## ✨ Features

- 🛡️ **Type Safety**: Full TypeScript support with automatic type inference from Zod schemas
- ✅ **Runtime Validation**: Automatic validation of stored/retrieved data using Zod schemas
- 🔒 **Strict Mode**: Strict mode enabled by default to prevent access to undefined keys
- 🧹 **Error Handling**: Configurable behavior for invalid data (clear or throw)
- 🚀 **Zero Runtime Overhead**: Only validates data when schemas are provided
- 📱 **React Native & Expo**: Compatible with both React Native and Expo projects
- 🔄 **Drop-in Replacement**: Maintains the same API as AsyncStorage with added type safety

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add zod-async-storage zod @react-native-async-storage/async-storage

# Using npm
npm install zod-async-storage zod @react-native-async-storage/async-storage

# Using yarn
yarn add zod-async-storage zod @react-native-async-storage/async-storage

# Using bun
bun add zod-async-storage zod @react-native-async-storage/async-storage
```

## 🚀 Quick Start

```ts
import { z } from "zod";
import { createAsyncStorage } from "zod-async-storage";

// Define your schemas
const schemas = {
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
  }),
};

// Create type-safe storage
const storage = createAsyncStorage(schemas);

// Use with full type safety
await storage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
});

const user = await storage.getItem("user"); // Type: User | null
```

## 📖 API Reference

### `createAsyncStorage(schemas, options?)`

Creates a type-safe AsyncStorage instance with validation.

#### Parameters

- **`schemas`**: `Record<string, ZodSchema>` - Object mapping keys to Zod schemas
- **`options`**: `GlobalOptions` (optional) - Configuration options

#### Global Options

```ts
type GlobalOptions = {
  strict?: boolean;        // Enforce only defined keys (default: true)
  onFailure?: "clear" | "throw"; // Handle zod validation failures (default: "clear")
  debug?: boolean;         // Enable debug logging (default: false)
};
```

### Instance Methods

All methods maintain the same signature as AsyncStorage but with added type safety:

#### `getItem(key, options?, callback?)`

Retrieves and validates an item from storage.

```ts
const user = await storage.getItem("user");
// Type: { id: string; name: string; email: string } | null

// Per-operation options
const user = await storage.getItem("user", { onFailure: "throw" });
```

#### `setItem(key, value, callback?)`

Stores an item with automatic serialization and type validation.

```ts
await storage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
}); // ✅ Type-safe

await storage.setItem("user", { invalid: "data" }); // ❌ TypeScript error
```

#### `multiGet(keys, options?, callback?)`

Retrieves multiple items with type safety for each key.

```ts
const results = await storage.multiGet(["user", "settings"]);
// Type: [["user", User | null], ["settings", Settings | null]]
```

#### `multiSet(keyValuePairs, callback?)`

Sets multiple items with type validation.

```ts
await storage.multiSet([
  ["user", { id: "123", name: "John", email: "john@example.com" }],
  ["settings", { theme: "dark", notifications: true }],
]);
```

#### Other Methods

- `removeItem(key, callback?)` - Remove an item
- `clear(callback?)` - Clear all storage
- `getAllKeys(callback?)` - Get all keys
- `multiRemove(keys, callback?)` - Remove multiple items
- `mergeItem(key, value, callback?)` - Merge with existing item
- `multiMerge(keyValuePairs, callback?)` - Merge multiple items
- `flushGetRequests()` - Flush pending get requests

## 🎯 Usage Examples

### Basic Usage

```ts
import { z } from "zod";
import { createAsyncStorage } from "zod-async-storage";

const schemas = {
  user: z.object({
    id: z.string(),
    name: z.string(),
    preferences: z.object({
      theme: z.enum(["light", "dark"]),
      language: z.string(),
    }),
  }),
};

const storage = createAsyncStorage(schemas);

// Set data
await storage.setItem("user", {
  id: "u1",
  name: "Alice",
  preferences: {
    theme: "dark",
    language: "en",
  },
});

// Get data (fully typed)
const user = await storage.getItem("user");
if (user) {
  console.log(user.preferences.theme); // TypeScript knows this exists
}
```

### Strict Mode (Default)

By default, strict mode is enabled to prevent access to undefined keys:

```ts
const storage = createAsyncStorage(schemas); // strict: true by default

await storage.getItem("user");        // ✅ OK
await storage.getItem("someUndefinedKey");   // ❌ TypeScript error
```

### Loose Mode

Disable strict mode to allow access to any key while maintaining type safety for schema-defined keys. This is useful if you are migrating to `zod-async-storage` and want to maintain access to keys that are not yet defined in schemas.

```ts
const storage = createAsyncStorage(schemas, { strict: false });

await storage.getItem("user");      // Type: User | null (validated)
await storage.getItem("any-key");   // Type: string | null (loose autocomplete, no validation)
```

With `strict: false`, you get:
- **Loose autocomplete**: Access any string key
- **Type-safe returns**: Keys matching schemas return validated types
- **Raw string fallback**: Unknown keys return `string | null`

### Error Handling

Configure how validation failures are handled:

```ts
// Clear invalid data (default)
const storage = createAsyncStorage(schemas, { onFailure: "clear" });

// Throw errors on invalid data
const storage = createAsyncStorage(schemas, { onFailure: "throw" });

// Per-operation override
const user = await storage.getItem("user", { onFailure: "throw" });
```

### Working with Raw Strings

Keys without schemas work with raw strings:

```ts
const schemas = {
  user: z.object({ name: z.string() }),
  // 'token' has no schema
};

const storage = createAsyncStorage(schemas);

await storage.setItem("user", { name: "John" });  // Validated object
await storage.setItem("token", "abc123");         // Raw string
```


## 🔧 Advanced Configuration

### Debug Mode

Enable debug logging to monitor validation failures:

```ts
const storage = createAsyncStorage(schemas, {
  debug: true,
  onFailure: "clear",
});

// When invalid data is found and cleared, you'll see:
// console.warn("Cleared invalid item", key);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zod](https://github.com/colinhacks/zod) for the excellent schema validation library
- [React Native AsyncStorage](https://github.com/react-native-async-storage/async-storage) for the underlying storage implementation

## 📚 Related Projects

- [zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation with static type inference
- [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) - Asynchronous, persistent, key-value storage system for React Native
