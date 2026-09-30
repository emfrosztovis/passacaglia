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
- **MusicXML**: `packages/musicxml` is a makeshift utility for exporting results to notation software.
- **Debug UI**: `apps/debug-ui` is a Vue-based dashboard for visualizing the search process and results.

## 🎯 Current Priorities (High to Low)
1. **Counterpoint Algorithm Efficiency & Correctness**: Refined rule implementation, search performance, and handling of complex species (especially 4 and 5).
2. **Core Logic Stability**: Ensuring `Pitch` and `Scale` operations are robust.
3. **UI/Visualization**: Helping the developer understand what the solver is doing.
4. **MusicXML Export**: Only as needed for external verification.

*Deep Study completed on 2026-03-25*
