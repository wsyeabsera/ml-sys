---
description: Evaluate a learning chapter as a teacher — find gaps in explanations, missing prerequisites, confusing jumps, and places where students get lost
---

Act as an experienced ML teacher evaluating a chapter for a junior developer learning ML from scratch.

## MCP tools used
- `read_file` — read the chapter source file to analyze its content
- Any tensor/autograd/attention tools — to verify examples are correct and runnable

## Parameters
- $ARGUMENTS — the chapter number or name (e.g., "3", "autograd", "neural networks", "all")

## Behavior

1. Read the chapter file from `site/src/pages/ChapterN.tsx`
2. Analyze it against these teaching quality criteria:

### A. Prerequisite gaps
- Does the chapter assume knowledge that wasn't taught in earlier chapters?
- Are there terms used without definition?
- Are there "wait, where did that come from?" moments?

### B. Conceptual jumps
- Where does the chapter skip from one idea to the next too fast?
- Are there places where a student would think "I don't see how A connects to B"?
- Is there a "why should I care?" motivation for each concept?

### C. Example quality
- Are the numerical examples actually worked through step by step?
- Can a student follow each calculation?
- Are the TryThis commands correct and will they work in the REPL?
- Do the PredictExercise answers match what the tools would return?

### D. Depth issues
- Where does the chapter say something like "this is important" but doesn't explain WHY?
- Where is the explanation too surface-level for real understanding?
- Are there concepts that need 3 paragraphs but get 1?

### E. Missing connections
- Does the chapter reference previous chapters properly ("remember strides from Ch2?")?
- Does it foreshadow future chapters ("this matters because in Ch5...")?
- Are there practical implications that aren't mentioned?

### F. Engagement
- Does the chapter have enough exercises between explanations?
- Are there long walls of text without interactive breaks?
- Is the humor natural or forced?
- Are the section titles engaging or boring?

3. Output a structured report:
```
## Chapter N: [Title] — Teaching Evaluation

### Grade: [A/B/C/D]

### What works well
- ...

### Critical gaps (student will get lost here)
- ...

### Missing depth
- ...

### Suggested additions
- ...

### Exercises to add
- ...
```

4. If the argument is "all", evaluate every chapter and produce a ranked list of which chapters need the most work.
