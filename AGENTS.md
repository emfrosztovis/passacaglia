# Passacaglia Agent Instructions

This repository contains `passacaglia`, an experimental procedural music engine implemented in TypeScript. It is structured as a monorepo using `pnpm`.

## 🛠 Build and Test Commands

Use `pnpm` to manage the project.

- **Install dependencies**: `pnpm install`
- **Build all packages**: `pnpm -r build`
- **Run all tests**: `pnpm -r test`
- **Run tests in watch mode**: `pnpm -r test --watch` (or `pnpm test` inside a package)
- **Typecheck**: `pnpm -r typecheck` (executes `tsc --noEmit` in packages)
- **Development (all)**: `pnpm dev` (runs `pnpm dev:pkgs` and `pnpm dev` in `debug-ui`)

### 🧪 Running a Single Test
To run a specific test file, use `vitest` with the file path:
```bash
# In root or specific package
pnpm vitest run packages/core/tests/StandardHeptatonic/Pitch.test.ts
```

## 🏗 Project Structure

- `apps/`: High-level applications
    - `debug-ui/`: Vite-based UI for debugging and visualizing music generation
- `packages/`: Core logic and shared utilities
    - `common/`: Shared types (`Rational`, `Debug`, `Hashable`, `Utils`)
    - `core/`: Core musical abstractions (Pitch, Interval, Scale, Tuning, etc.)
    - `musicxml/`: MusicXML export/import logic
    - `species-counterpoint/`: Implementation of species counterpoint rules

## 📜 Code Style Guidelines

### 🔡 Language & Formatting
- **TypeScript**: Use TypeScript for all code. Follow modern ESM standards.
- **Indentation**: **4 spaces**. Do not use tabs.
- **Line Length**: Aim for ~100 characters.
- **Semicolons**: Always use semicolons.
- **Quotes**: Prefer single quotes for strings (`'...'`), except for complex nested strings.

### 🏷 Naming Conventions
- **Classes/Interfaces/Enums**: `PascalCase` (e.g., `PitchSystem`, `PitchClass`)
- **Variables/Functions/Methods**: `camelCase` (e.g., `ord()`, `distanceTo()`, `addAccidental()`)
- **Constants**: `SCREAMING_SNAKE_CASE` or `PascalCase` if they are static objects.
- **Private/Protected**: Prefix with `_` if truly private and used only for internal implementation.

### 📦 Imports & Exports
- **ESM**: Use `import { ... } from '...'`.
- **Barrel Exports**: Use `index.ts` files in each subdirectory to export public APIs.
- **Cross-package imports**: Use workspace references (e.g., `import { ... } from 'common'`).
- **Relative imports**: Use relative paths for internal package files (`./PitchSystem`).

### 🏛 Types and Classes
- **Class Structure**:
    - Use `public readonly` for immutable properties.
    - Use `abstract class` for base implementations.
    - Implement `Hashable` (from `common`) if the object is used in sets or maps.
- **Rational Numbers**: This project uses rational numbers for musical timing and pitches.
    - Import `Rational` and `AsRational` from `common`.
    - Use `Rational.from(val)` to create rational numbers from numbers or strings.
    - Use `Rational.array([...])` to convert an array of values to `Rational[]`.
    - Avoid floating point math for exact musical values (pitch ordinals, durations). Use `rational.value()` only when necessary (e.g. for display or external APIs).
- **Common Utilities**:
    - Use `modulo(n, m)` from `common/Utils` for musical periodicity (handles negative numbers correctly).
    - Use `Serializable` interface for objects that need to be sent across workers or saved.

### 🚨 Error Handling & Debugging
The `common` package provides a `Debug` utility. Use it instead of raw `console` or `throw` when possible:
- **Assertions**: `Debug.assert(condition, message?)` for internal invariant checking.
- **Logging**: `Debug.info()`, `Debug.warn()`, `Debug.error()`.
- **Unreachable Code**: `Debug.never(value)` for exhaustiveness checking in switch/cases.
- **Early Returns**: `Debug.early(file, function, line)` for documenting early exit points.
- **Log Levels**: Configure via `Debug.level = LogLevel.Debug` for verbose output.

### 🧪 Testing Guidelines
- Use **Vitest** for all testing.
- Test files should be located in a `tests/` directory within each package, mirroring the `src/` structure.
- Use `expect().eq()` or `expect().toBe()` for simple checks.
- Group tests logically using `test()` blocks.
- Prefer descriptive test names (e.g., `test('add interval', () => { ... })`).
- Use `test.each()` for data-driven tests of musical transformations.

## 🎹 Domain Specifics
- **Pitch**: Represented as a 3-tuple (degree index, accidental, period index). Degrees are 0-indexed.
- **Interval**: Represented as steps and distance (Rational). Intervals can be directed (positive/negative).
- **System**: Musical systems define how degrees and accidentals behave (e.g., `StandardHeptatonic`, `ET12`).
- **Containers**: Musical structure is often represented using `SequentialContainer` or `EventContainer`.
- **Hashing**: Objects like `Pitch`, `Interval`, and `Rational` implement `Hashable`. Always use `obj.hash()` when using them as keys in a Map or elements in a Set if identity is not enough.
- **MusicXML**: Use the `musicxml` package to generate or parse MusicXML files. It uses a builder pattern for creating documents.

## 🤖 Agent Workflow
- **Context Awareness**: **MANDATORY**: Before starting any task, read `NOTEPAD.md` at the project root to understand the current state, known issues, and architectural context.
- **Session Closure**: **MANDATORY**: Update `NOTEPAD.md` at the end of every session with your findings, new TODOs, and any questions for the user.
- **Explore**: Use `glob` and `grep` to find existing patterns.
- **Consistency**: Follow existing patterns for `Pitch`, `Interval`, and `Scale` implementations.
- **Verification**: Always run `pnpm typecheck` and `pnpm test` after making changes to core logic.
- **Documentation**: Use JSDoc for public classes and methods.
- **Refactoring**: When refactoring core musical logic, ensure all existing tests in `packages/core/tests` pass, as these are highly interconnected.

---
*Created on 2026-03-25 for Passacaglia Agentic Operations*
