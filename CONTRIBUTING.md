# Contributing to @stork-tools/zod-async-storage

Thank you for your interest in contributing to this project! We appreciate your help in making this library better for everyone.

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** 10.14 or higher (specified in `package.json`)

### Setting Up Your Development Environment

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

## 🔄 Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout main
git pull upstream main  # if you have upstream configured
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes  
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements

### Making Changes

1. **Write your code** following our coding standards
2. **Add tests** for new functionality or bug fixes
3. **Update documentation** if needed

### Adding a Changeset

For any code changes that affect users, add a changeset:

```bash
pnpm changeset
```

Select the appropriate change type:
- **patch**: Bug fixes, documentation, internal changes
- **minor**: New features, new exports
- **major**: Breaking changes

Write a clear description of your changes that users will see in the changelog.

## 📝 Coding Standards

### TypeScript Guidelines

- **No `any` types** - Always provide proper types
- **Prefer type guards** over type casting
- **Use strict TypeScript settings** - no bypassing type checks
- **Export types and interfaces** when they're part of the public API

### Code Style

We use Biome for formatting and linting. Our key preferences:

- **Arrow functions** over function declarations
- **Named exports** over default exports
- **Descriptive variable names** that clearly indicate purpose
- **JSDoc comments** for all public APIs

Example:
```typescript
/**
 * Creates a type-safe AsyncStorage wrapper with Zod validation
 * @param schemas - Object mapping keys to Zod schemas
 * @param options - Configuration options
 * @returns Typed AsyncStorage interface
 */
export const createAsyncStorage = <T extends Record<string, z.ZodSchema>>(
  schemas: T,
  options?: AsyncStorageOptions
): AsyncStorageWrapper<T> => {
  // Implementation...
};
```

### File Organization

- **One main export per file** when possible
- **Group related functionality** together
- **Use barrel exports** (`index.ts`) to expose public APIs
- **Keep internal utilities** in separate files

## 🧪 Testing Guidelines

### Test Structure

We use Vitest for testing. Tests should:

- **Cover all public APIs** and their edge cases
- **Test error conditions** and invalid inputs
- **Use descriptive test names** that explain what's being tested
- **Follow the AAA pattern**: Arrange, Act, Assert

### Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createAsyncStorage } from '../src';

describe('createAsyncStorage', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should validate data when storing values', async () => {
    // Arrange
    const AsyncStorage = createAsyncStorage({
      user: z.object({ name: z.string() })
    });

    // Act & Assert
    await expect(
      AsyncStorage.setItem('user', { name: 123 })
    ).rejects.toThrow('Invalid data');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test AsyncStorage.test.ts
```

## 📤 Submitting Changes

### Pull Request Process

1. **Add a changeset** (if needed):
   ```bash
   pnpm changeset
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new validation feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** - CI will validate your changes

### Pull Request Guidelines

- **Use the PR template** provided by GitHub
- **Write clear commit messages** that explain what and why
- **Keep PRs focused** - one feature or fix per PR
- **Include tests** for new functionality
- **Update documentation** when needed
- **Respond to feedback** promptly and respectfully

### Commit Message Format

We follow conventional commits:

```
type(scope): description

feat(storage): add batch operations support
fix(validation): handle null values correctly  
docs(readme): update installation instructions
test(hooks): add useAsyncStorage test coverage
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

## 🚀 Release Process

This project uses automated releases with changesets:

1. **Changesets accumulate** in the `.changeset` directory
2. **Version PR is created** automatically when changes are merged to main
3. **Packages are published** when the Version PR is merged
4. **GitHub releases** are created automatically

You don't need to worry about versioning - just add changesets for your changes!

## 🆘 Getting Help

### Where to Ask Questions

- **GitHub Discussions**: For general questions and ideas
- **Issues**: For bug reports and feature requests  
- **Pull Request comments**: For specific code questions

### Before Asking

1. **Search existing issues** and discussions
2. **Check the documentation** and examples
3. **Review recent PRs** for similar changes

### Providing Good Context

When asking for help:

- **Describe what you're trying to do**
- **Show your code** and configuration
- **Include error messages** and stack traces
- **Mention your environment** (React Native version, platform, etc.)

## 🙏 Recognition

Contributors are recognized in several ways:

- **Listed in package.json** contributors field
- **Mentioned in release notes** for significant contributions
- **GitHub contributors graph** shows your impact
- **Special thanks** in major release announcements

---

Thank you for contributing to @stork-tools/zod-async-storage! Your help makes this project better for the entire React Native and Expo community. 🎉
