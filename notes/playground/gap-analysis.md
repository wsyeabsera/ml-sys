# Gap Analysis — 2026-03-15

## Critical (fix now)

### 1. ToolReference missing 7 tools
**Status:** FIXED (2026-03-15) — All 28 tools now documented across 7 categories
**Impact:** Users can't discover these tools exist
**Missing:**
- `tensor_get` — N-dimensional element access
- `autograd_neuron_tensor` — tensor-level layer with autograd
- `gguf_inspect` — inspect GGUF model files
- `gguf_load_tensor` — load tensor from GGUF
- `llama_load` — load LLaMA model
- `llama_generate` — generate text
- `llama_inspect` — inspect loaded model
- `read_file` — read project files
- `cargo_exec` — run cargo commands

### 2. Chapter3/4 use old ChapterNav, missing ClaudePrompts
**Status:** FIXED (2026-03-15) — Chapter4 uses Link back, Chapter3 is dead code (not routed)
**Impact:** Inconsistent UI on misc pages
**Fix:** Replace ChapterNav with simple back link, add ClaudePrompts or remove if not needed for misc pages

### 3. Notes outdated
**Status:** FIXED (2026-03-15) — README.md updated with correct counts
**Impact:** Confusing for future Claude sessions
**Fix:** Update README.md and next-phase-training.md to match reality:
- 6 visualizer types (not 5)
- 2 project pages built (not 4)
- Tool Reference has training tools

## High Priority (fix soon)

### 4. Chapters 1, 2, 8, 10 have no PredictExercise
**Status:** FIXED (2026-03-15) — Ch1: 2, Ch2: 4, Ch8: 3, Ch10: 3. Total across all pages: 41 exercises
**Impact:** Inconsistent learning — some chapters have predict-then-verify, some don't
**Chapters needing exercises:**
- Ch1 (Intro): maybe 1-2 conceptual exercises
- Ch2 (Tensors): 3-4 exercises on shapes, strides, transpose
- Ch8 (Model Files): 1-2 exercises on GGUF structure
- Ch10 (Running LLM): 1-2 exercises on inference pipeline

### 5. No Visualizer for dataset/evaluation/prediction results
**Status:** FIXED (2026-03-15) — Evaluation viz with accuracy/loss cards + prediction grid. Dataset/prediction use compact formatted display.
**Impact:** These result types show raw JSON when opened in Visualizer
**Fix:** Add DatasetViz (scatter plot), EvaluationViz (predictions vs targets), keep prediction as compact text

## Low Priority (housekeeping)

### 6. ChapterNav deprecated
**Status:** FIXED (2026-03-15) — ChapterNav.tsx and Chapter3.tsx deleted. No remaining references.

### 7. Tests not committed
**Status:** OPEN — remind user to `git add tests/` and commit

