# @stork-tools/zod-async-storage

[![npm version](https://img.shields.io/npm/v/@stork-tools/zod-async-storage.svg)](https://www.npmjs.com/package/@stork-tools/zod-async-storage)
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
pnpm add @stork-tools/zod-async-storage zod @react-native-async-storage/async-storage

# Using npm
npm install @stork-tools/zod-async-storage zod @react-native-async-storage/async-storage

# Using yarn
yarn add @stork-tools/zod-async-storage zod @react-native-async-storage/async-storage

# Using bun
bun add @stork-tools/zod-async-storage zod @react-native-async-storage/async-storage
```

## 🚀 Quick Start

```ts
import { z } from "zod";
import { createAsyncStorage } from "@stork-tools/zod-async-storage";

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
const AsyncStorage = createAsyncStorage(schemas);

// Use with full type safety
await AsyncStorage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
});

const user = await AsyncStorage.getItem("user"); // Type: User | null
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
const user = await AsyncStorage.getItem("user");
// Type: { id: string; name: string; email: string } | null

// Per-operation options
const user = await AsyncStorage.getItem("user", { onFailure: "throw" });
```

#### `setItem(key, value, callback?)`

Stores an item with automatic serialization and type validation.

```ts
await AsyncStorage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
}); // ✅ Type-safe

await AsyncStorage.setItem("user", { invalid: "data" }); // ❌ TypeScript error
```

#### `multiGet(keys, options?, callback?)`

Retrieves multiple items with type safety for each key.

```ts
const results = await AsyncStorage.multiGet(["user", "settings"]);
// Type: [["user", User | null], ["settings", Settings | null]]
```

#### `multiSet(keyValuePairs, callback?)`

Sets multiple items with type validation.

```ts
await AsyncStorage.multiSet([
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
import { createAsyncStorage } from "@stork-tools/zod-async-storage";

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

const AsyncStorage = createAsyncStorage(schemas);

// Set data
await AsyncStorage.setItem("user", {
  id: "u1",
  name: "Alice",
  preferences: {
    theme: "dark",
    language: "en",
  },
});

// Get data (fully typed)
const user = await AsyncStorage.getItem("user");
if (user) {
  console.log(user.preferences.theme); // TypeScript knows this exists
}
```

### Strict Mode (Default)

By default, strict mode is enabled to prevent access to undefined keys:

```ts
const AsyncStorage = createAsyncStorage(schemas); // strict: true by default

await AsyncStorage.getItem("user");        // ✅ OK
await AsyncStorage.getItem("someUndefinedKey");   // ❌ TypeScript error
```

### Loose Mode

Disable strict mode to allow access to any key while maintaining type safety for schema-defined keys. This is useful if you are migrating to `@stork-tools/zod-async-storage` and want to maintain access to keys that are not yet defined in schemas.

```ts
const AsyncStorage = createAsyncStorage(schemas, { strict: false });

await AsyncStorage.getItem("user");      // Type: User | null (validated)
await AsyncStorage.getItem("any-key");   // Type: string | null (loose autocomplete, no validation)
```

With `strict: false`, you get:
- **Loose autocomplete**: Access any string key
- **Type-safe returns**: Keys matching schemas return validated types
- **Raw string fallback**: Unknown keys return `string | null`

### Error Handling

Configure how validation failures are handled:

```ts
// Clear invalid data (default)
const AsyncStorage = createAsyncStorage(schemas, { onFailure: "clear" });

// Throw errors on invalid data
const AsyncStorage = createAsyncStorage(schemas, { onFailure: "throw" });

// Per-operation override
const user = await AsyncStorage.getItem("user", { onFailure: "throw" });
```

### Working with Raw Strings

Keys without schemas work with raw strings:

```ts
const schemas = {
  user: z.object({ name: z.string() }),
  // 'token' has no schema
};

const AsyncStorage = createAsyncStorage(schemas);

await AsyncStorage.setItem("user", { name: "John" });  // Validated object
await AsyncStorage.setItem("token", "abc123");         // Raw string
```


## 🪝 React Hooks

```ts
import { createAsyncStorage, createUseAsyncStorage } from "@stork-tools/zod-async-storage";

const storage = createAsyncStorage(schemas);
const { useAsyncStorage } = createUseAsyncStorage(storage);

function UserProfile() {
  const { getItem, setItem, removeItem } = useAsyncStorage("user");
  
  const loadUser = async () => {
    const user = await getItem(); // Fully typed
  };
  
  const saveUser = async () => {
    await setItem({ id: "123", name: "John" });
  };
  
  const clearUser = async () => {
    await removeItem();
  };
  
  // Your component JSX...
}
```

## 🔧 Advanced Configuration

### Debug Mode

Enable debug logging to monitor validation failures:

```ts
const AsyncStorage = createAsyncStorage(schemas, {
  debug: true,
  onFailure: "clear",
});

// When invalid data is found and cleared, you'll see:
// console.warn("Cleared invalid item", key);
```

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or sharing feedback, your help makes this project better.

### Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stork.git
   cd stork
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** following our coding standards
6. **Add a changeset** (for user-facing changes):
   ```bash
   pnpm changeset
   ```
7. **Commit and push** your changes
8. **Open a Pull Request** - CI will handle testing and validation

### Types of Contributions

- 🐛 **Bug Reports**: Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- ✨ **Feature Requests**: Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- 💻 **Code Contributions**: Follow our coding standards and include tests
- 📚 **Documentation**: Help improve our docs and examples
- 🧪 **Testing**: Add or improve test coverage
- 💬 **Discussions**: Share ideas in [GitHub Discussions](https://github.com/kevinschaffter/stork/discussions)

### Key Guidelines

- **Type Safety**: No `any` types, use type guards over casting
- **Testing**: Include tests for new features and bug fixes
- **Changesets**: Run `pnpm changeset` for user-facing changes
- **Code Style**: Follow existing patterns, JSDoc for public APIs

For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zod](https://github.com/colinhacks/zod) for the excellent schema validation library
- [React Native AsyncStorage](https://github.com/react-native-async-storage/async-storage) for the underlying storage implementation