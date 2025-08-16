# Stork Tools

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A collection of **type-safe** and **validated** storage wrappers using Zod schemas. Enjoy the benefits of runtime validation, automatic type inference, and better developer experience when working with storage APIs across different platforms.

## ✨ Features

Both packages share these core features:

- 🛡️ **Type Safety**: Full TypeScript support with automatic type inference from Zod schemas
- ✅ **Runtime Validation**: Automatic validation of stored/retrieved data using Zod schemas
- 🔒 **Strict Mode**: Strict mode enabled by default to prevent access to undefined keys
- 🧹 **Error Handling**: Configurable behavior for invalid data (clear or throw)
- 🚀 **Zero Runtime Overhead**: Only validates data when schemas are provided
- 🔄 **Drop-in Replacement**: Maintains the same API as the underlying storage with added type safety
- 🔄 **Incremental Adoption**: Start with a single schema and add more later
- 🪝 **React Hooks**: Optional React hooks for seamless integration

## 📦 Packages

This monorepo contains two complementary packages for type-safe storage solutions:

### [@stork-tools/zod-async-storage](./packages/zod-async-storage)
[![npm version](https://img.shields.io/npm/v/@stork-tools/zod-async-storage.svg)](https://www.npmjs.com/package/@stork-tools/zod-async-storage)

**For React Native & Expo applications**

A type-safe wrapper around `@react-native-async-storage/async-storage` with Zod validation. Perfect for mobile development with React Native and Expo.

### [@stork-tools/zod-local-storage](./packages/zod-local-storage)
[![npm version](https://img.shields.io/npm/v/@stork-tools/zod-local-storage.svg)](https://www.npmjs.com/package/@stork-tools/zod-local-storage)

**For Web & Browser applications**

A type-safe wrapper around the browser's `localStorage` API with Zod validation. Ideal for web applications requiring client-side persistence.

## 📖 Getting Started

Each package includes comprehensive documentation with installation instructions, API reference, and examples:

- **AsyncStorage**: See the [zod-async-storage README](./packages/zod-async-storage/README.md)
- **localStorage**: See the [zod-local-storage README](./packages/zod-local-storage/README.md)

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