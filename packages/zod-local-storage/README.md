# @stork-tools/zod-local-storage

[![npm version](https://img.shields.io/npm/v/@stork-tools/zod-local-storage.svg)](https://www.npmjs.com/package/@stork-tools/zod-local-storage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A **type-safe** and **validated** wrapper around `localStorage` using Zod schemas. Enjoy the benefits of runtime validation, automatic type inference, and better developer experience when working with localStorage in web applications. This library is a drop-in replacement for `localStorage` with added type safety.

## ✨ Features

- 🛡️ **Type Safety**: Full TypeScript support with automatic type inference from Zod schemas
- 🔄 **Drop-in Replacement**: Maintains the same API as localStorage with added type safety
- 🔄 **Incremental adoption**: You can start with a single schema and add more later
- ✅ **Runtime Validation**: Automatic validation of stored/retrieved data using Zod schemas
- 🔒 **Strict Mode**: Strict mode enabled by default to prevent access to undefined keys
- 🧹 **Error Handling**: Configurable behavior for invalid data (clear or throw)
- 🚀 **Zero Runtime Overhead**: Only validates data when schemas are provided
- 🌐 **Browser Compatible**: Works in all modern browsers with localStorage support

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @stork-tools/zod-local-storage zod

# Using npm
npm install @stork-tools/zod-local-storage zod

# Using yarn
yarn add @stork-tools/zod-local-storage zod

# Using bun
bun add @stork-tools/zod-local-storage zod
```

## 🚀 Quick Start

```ts
import { z } from "zod";
import { createLocalStorage } from "@stork-tools/zod-local-storage";

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

// Create a single instance of type-safe storage
export const localStorage = createLocalStorage(schemas);

import { localStorage } from "~/local-storage";

// Use with full type safety
localStorage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
});

const user = localStorage.getItem("user"); // Type: User | null
```

## 📖 API Reference

### `createLocalStorage(schemas, options?)`

Creates a type-safe localStorage instance with validation.

#### Parameters

- **`schemas`**: `Record<string, ZodSchema>` - Object mapping keys to Zod schemas
- **`options`**: `GlobalOptions` (optional) - Configuration options

#### Global Options

```ts
type GlobalOptions = {
  strict?: boolean;        // Enforce only defined keys (default: true)
  onFailure?: "clear" | "throw"; // Handle zod validation failures (default: "clear")
  debug?: boolean;         // Enable debug logging (default: false)
  onValidationError?: (key: string, error: z.ZodError, value: unknown) => void; // Callback on validation failure
};
```

### Instance Methods

All methods maintain the same signature as localStorage but with added type safety:

#### `getItem(key, options?)`

Retrieves and validates an item from storage.

```ts
const user = localStorage.getItem("user");
// Type: { id: string; name: string; email: string } | null

// Per-operation options
const user = localStorage.getItem("user", { onFailure: "throw" });
```

#### `setItem(key, value)`

Stores an item with automatic serialization and type validation.

```ts
localStorage.setItem("user", {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
}); // ✅ Type-safe

localStorage.setItem("user", { invalid: "data" }); // ❌ TypeScript error
```

#### `removeItem(key)`

Removes an item from storage.

```ts
localStorage.removeItem("user");
```

#### `clear()`

Clears all storage.

```ts
localStorage.clear();
```

#### `key(index)`

Gets the key at the specified index.

```ts
const keyAtIndex = localStorage.key(0); // string | null
```

#### `length`

Gets the number of items in storage.

```ts
const itemCount = localStorage.length; // number
```

## 🎯 Usage Examples

### Basic Usage

```ts
import { z } from "zod";
import { createLocalStorage } from "@stork-tools/zod-local-storage";

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

// Create a single instance of type-safe storage
export const localStorage = createLocalStorage(schemas);

import { localStorage } from "~/local-storage";

// Set data
localStorage.setItem("user", {
  id: "u1",
  name: "Alice",
  preferences: {
    theme: "dark",
    language: "en",
  },
});

// Get data (fully typed)
const user = localStorage.getItem("user");
if (user) {
  console.log(user.preferences.theme); // TypeScript knows this exists
}
```

### Strict Mode (Default)

By default, strict mode is enabled to prevent access to undefined keys:

```ts
const localStorage = createLocalStorage(schemas); // strict: true by default

localStorage.getItem("user");        // ✅ OK
localStorage.getItem("someUndefinedKey");   // ❌ TypeScript error
```

### Loose Mode

Disable strict mode to allow access to any key while maintaining type safety for schema-defined keys. This is useful if you are migrating to `@stork-tools/zod-local-storage` and want to maintain access to keys that are not yet defined in schemas.

```ts
const localStorage = createLocalStorage(schemas, { strict: false });

localStorage.getItem("user");      // Type: User | null (validated)
localStorage.getItem("any-key");   // Type: string | null (loose autocomplete, no validation)
```

With `strict: false`, you get:
- **Loose autocomplete**: Access any string key
- **Type-safe returns**: Keys matching schemas return validated types
- **Raw string fallback**: Unknown keys return `string | null`

### Error Handling

Configure how validation failures are handled:

```ts
// Clear invalid data (default)
const localStorage = createLocalStorage(schemas, { onFailure: "clear" });

// Throw errors on invalid data
const localStorage = createLocalStorage(schemas, { onFailure: "throw" });

// Per-operation override
const user = localStorage.getItem("user", { onFailure: "throw" });
```

#### Validation Error Callbacks

Get notified when validation fails using the `onValidationError` callback:

```ts
const localStorage = createLocalStorage(schemas, {
  onFailure: "clear",
  onValidationError: (key, error, value) => {
    // Log validation failures for monitoring
    console.warn(`Validation failed for key "${key}":`, error.message);
    
    // Send to analytics
    analytics.track('validation_error', {
      key,
      errors: error.issues,
      invalidValue: value
    });
  }
});

// Per-operation callback override
const user = localStorage.getItem("user", {
  onValidationError: (key, error, value) => {
    // Handle this specific validation error differently
    showUserErrorMessage(`Invalid user data: ${error.message}`);
  }
});
```

The callback receives:
- `key`: The storage key that failed validation
- `error`: The Zod validation error with detailed issues
- `value`: The raw parsed value that failed validation

**Note**: The callback is only called for Zod schema validation failures, not for JSON parsing errors.

### Working with Raw Strings

Keys without schemas work with raw strings:

```ts
const schemas = {
  user: z.object({ name: z.string() }),
  // 'token' has no schema
};

const localStorage = createLocalStorage(schemas);

localStorage.setItem("user", { name: "John" });  // Validated object
localStorage.setItem("token", "abc123");         // Raw string
```

## 🪝 React Hooks

```ts
import { createLocalStorage, createUseLocalStorage } from "@stork-tools/zod-local-storage";

const localStorage = createLocalStorage(schemas);
const { useLocalStorage } = createUseLocalStorage(localStorage);

function UserProfile() {
  const { getItem, setItem, removeItem } = useLocalStorage("user");
  
  const loadUser = () => {
    const user = getItem(); // Type: User | null
  };
  
  const saveUser = () => {
    setItem({ id: "123", name: "John", email: "john@example.com" });
  };
  
  const clearUser = () => {
    removeItem();
  };
}
```

### Hook Methods

- `getItem(options?)` - Retrieve item with type safety
- `setItem(value)` - Store item with validation  
- `removeItem()` - Remove item from storage

All methods support the same options as the storage instance.

## 🔧 Advanced Configuration

### Debug Mode

Enable debug logging to monitor validation failures:

```ts
export const localStorage = createLocalStorage(schemas, {
  debug: true,
  onFailure: "clear",
});

// When invalid data is found and cleared, you'll see:
// console.warn("Cleared invalid item", key);
```

### Browser Compatibility

This library works in all modern browsers that support localStorage:

- Chrome 4+
- Firefox 3.5+
- Safari 4+
- IE 8+
- Edge (all versions)

### Storage Limitations

localStorage has some limitations to be aware of:

- **Storage Limit**: ~5-10MB per origin (varies by browser)
- **Synchronous**: All operations are synchronous and can block the main thread
- **String Only**: localStorage only stores strings (this library handles JSON serialization automatically)
- **Same Origin**: Data is only accessible within the same origin

### Error Scenarios

Common localStorage errors this library handles:

```ts
// Quota exceeded
try {
  localStorage.setItem("key", largeData);
} catch (error) {
  // Handle storage quota exceeded
}

// localStorage disabled/unavailable
try {
  const data = localStorage.getItem("key");
} catch (error) {
  // Handle localStorage not available (private browsing, etc.)
}
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

For detailed contributing guidelines, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zod](https://github.com/colinhacks/zod) for the excellent schema validation library
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) for the underlying storage implementation