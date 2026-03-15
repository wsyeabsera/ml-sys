# Project 4: Tiny Language Model — Ideas & Planning

Status: **brainstorming** (not started)

## What this should teach
- What is a language model at the simplest level?
- Character tokenization (why tokens, why not raw characters?)
- Embedding layers (turning discrete tokens into vectors)
- Sequence prediction (given "hel", predict "l")
- How training on text actually works (sliding window, teacher forcing)
- Connection to the real LLMs from chapters 7-8

## Questions to answer before building
1. What's the simplest thing that counts as a "language model"?
2. What new concepts does the learner need beyond chapters 1-9?
3. What's the minimum set of new Rust tools to make it interactive?
4. What does the training loop look like? (char sequences → embeddings → MLP → next char prediction?)
5. What corpus? (tiny Shakespeare? a few sentences? user-provided text?)

## New tools needed (probably)
- `char_tokenize` — string → token IDs, build vocab
- `create_embedding` — token IDs → learned vectors (new tensor type or just a weight matrix lookup?)
- Possibly `sequence_dataset` — sliding window over tokenized text
- Existing `init_mlp` / `train_mlp` might work if embedding output feeds into MLP

## New chapters needed
- Chapter 10: Embeddings & Tokenization (bridges Ch9 Training → Project 4)
- Or fold into existing chapter 7 (Transformers)?

## New project page
- `ProjectLM.tsx` — guided walkthrough like AND/XOR/Attention projects
- Steps: pick text → tokenize → train → generate → observe quality vs corpus size

## Open questions
- How small can we go and still see interesting behavior?
- Should generation be autoregressive (feed output back as input) or just next-char?
- Autoregressive is cooler and teaches a real concept — worth the complexity?

## Decision: document first, build later
Write the "what this project teaches" section fully before touching any Rust code.
Come back to this after working through the existing chapters and projects hands-on.
