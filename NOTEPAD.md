# Passacaglia Project Notepad

This project is an experimental procedural music engine, with a current focus on **Species Counterpoint** generation.

## 🏗 Architecture & Core Concepts

### 1. Fundamental Musical Data (`packages/core`)
- **Pitch**: A 3-tuple `(degree_index, accidental, period_index)`. This avoids the ambiguity of MIDI numbers and allows for proper spelling (e.g., C# vs. Db).
- **Interval**: Steps and distance (represented as `Rational`).
- **Scale**: A collection of degrees and intervals. Supports transposition and rotation (modes).
- **PitchSystem**: Defines the structure of the musical space (e.g., `StandardHeptatonic` for 7-note scales, `ET12`).

### 2. Species Counterpoint Engine (`packages/species-counterpoint`)
- **Solver**: Uses A* or Beam Search to find a valid musical score.
    - **State**: A `Node` contains a `Score` (all voices + harmony).
    - **Search**: Progresses by filling measures and notes according to schemas.
    - **Optimization**: Currently uses unique IDs for hashing, meaning state deduplication is not active. It uses a "remove old" strategy to prune nodes far from the frontier.
- **Context & Rules**: `CounterpointContext` manages rules:
    - `LocalRule`: Heuristic or hard constraint on a single note/event (e.g., vertical consonance, motion costs).
    - `GlobalRule`: Validity check on the entire score.
    - `CandidateRule`: Filters possible pitches for a note (harmonic vs. non-harmonic tones).
- **Species Definitions**: `Species1` through `Species5` are defined using `MeasureSchema` and `NoteSchema`.
    - `Species4` (Syncopation): Uses `makeSuspension` and `enforceSuspension` to handle ties and resolutions.
    - `Species5` (Florid): A complex mixture using `vdiff` to ensure rhythmic independence between voices.

### 3. Utilities & Integration
- **Rational Math**: `packages/common` provides exact math to avoid floating-point drift in musical timing.
- **MusicXML**: `packages/musicxml` is a **makeshift utility** for exporting results to notation software.
- **Debug UI**: `apps/debug-ui` is a Vue-based dashboard for visualizing the search process and results.

## 🎯 Current Priorities (High to Low)
1. **Counterpoint Algorithm Efficiency & Correctness**: Refined rule implementation, search performance, and handling of complex species (especially 4 and 5).
2. **Core Logic Stability**: Ensuring `Pitch` and `Scale` operations are robust.
3. **UI/Visualization**: Helping the developer understand what the solver is doing.
4. **MusicXML Export**: Only as needed for external verification.

## ⚠️ Known Issues & Technical Debt

### 🚀 Performance & Algorithm (High Priority)
- **State Deduplication**: `Node.hash()` in `Solver.ts` uses `this.id.toString()`. This prevents the solver from recognizing when it has reached the same musical state via different paths. While counterpoint is mostly linear, this could impact performance in complex multi-voice scenarios.
- **FakeMeasure p0 Issue**: `FakeMeasure` in `SpeciesBase.ts` fills measures with a dummy pitch to trigger checks. This can cause false negatives in rules if the dummy pitch violates a constraint (e.g., creating a bad interval).

### 🎼 Musical Logic (Medium Priority)
- **Suspension Requirements**: `Species.ts` has a `FIXME: require suspension` in species 5.
- **Voice Independence**: The `vdiff` check in species 5 is a good start but might need more nuance to ensure truly artistic florid counterpoint.
- **Vertical Consonance**: `enforceVerticalConsonanceWithMovingLocal` assumes the last voice is the bass. This might not be true in all scores or during specific transformations.

## ❓ Questions for the User
1. Regarding `Solver.ts`: Was state deduplication (hashing the `Score`) disabled intentionally due to performance costs of hashing large scores?
2. For `FakeMeasure`: Would you prefer a more "lazy" evaluation where rules only check partially filled measures, or should we refine the "fake" pitch selection?
3. In Species 5, how strictly should we follow Fuxian or other historical rules versus developing an "agentic" style?

## 🚨 Typing & Structural Challenges (Containers & Cursors)

I've investigated the `@ts-expect-error` occurrences primarily located around cursor instantiation (`Basic.ts`, `Voice.ts`, `SpeciesBase.ts`). 

### The Problem

The core issue stems from how TypeScript handles generic constraints, specifically variance, when dealing with nested tree structures like `Cursor<Value, Container, ParentCursor>`.

1. **Covariance/Contravariance mismatch in `withParent`**:
   The signature in the base class is:
   `abstract withParent<P2 extends Cursor<C, WithCursor<C>, any> | never>(p: P2): Cursor<T, C, P2>;`
   
   However, subclasses like `SequentialCursor` implement it like this:
   `withParent<P2 extends Cursor<C, WithCursor<C>, any> | never>(p: P2): SequentialCursor<T, C, P2>`
   
   When you attempt to use `withParent` on a more specific subclass (like `MeasureCursor` downcasting to `CounterpointNoteCursor`), TypeScript complains. A `SequentialCursor`'s container type `C` expects a specific `SequentialContainer<T>`, but the generic bound `Cursor<C, WithCursor<C>, any>` is wider. Thus, TypeScript cannot guarantee that the `p` passed in is actually a valid parent cursor for *this specific type* of sequence.

2. **Self-referential `This` in `WithCursor`**:
   `WithCursor<T, This extends WithCursor<T, any> = any>` attempts to enforce that a container returns cursors pointing back to itself. However, when you do `Measure extends SequentialContainer<Note>`, `SequentialContainer`'s `first()` method returns a `SequentialCursor<T, this, never>`. 
   When the consumer calls `m.value.cursorAtTime(...)?.withParent(m)` in `Voice.ts`, `m` is a `MeasureCursor`, but the generic bounds of `withParent` expect something slightly different structurally due to the recursive definition of `P` extending `Cursor`.

### Consumer Code Impact
In consumer code (e.g., `Voice.ts`), you have code like:
```typescript
noteAt(t: AsRational): NoteCursor | undefined {
    // ...
    // @ts-expect-error
    return m.value.cursorAtTime(t.sub(m.globalTime))?.withParent(m);
}
```
Here, `m.value` is a `Measure`. `cursorAtTime` returns a `SequentialCursor<Note, this (Measure), never>`. You try to attach `m` (which is a `MeasureCursor` aka `SequentialCursor<Measure, Voice, never>`) as the parent. TypeScript rejects this because the type bounds for `P2` in `withParent` are incredibly complex and rigid, and replacing `never` with a concrete `MeasureCursor` type breaks the inferred variance.

### Conclusion
The types are "unpleasant" because you are trying to enforce deep, recursive tree invariants strictly at the type level. TypeScript's structural typing struggles with recursive generic bounds where the parent type needs to know about the child type's container, and the child cursor needs to know about the parent cursor's container.

*Deep Study completed on 2026-03-25*
