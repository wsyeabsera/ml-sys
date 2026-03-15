import { describe, it, expect, beforeEach } from "vitest";
import { createEvalEngine } from "../../src/lib/eval-engine";

describe("eval engine", () => {
  let engine: ReturnType<typeof createEvalEngine>;

  beforeEach(() => {
    engine = createEvalEngine();
  });

  describe("basic expressions", () => {
    it("evaluates arithmetic", () => {
      expect(engine.evalCode("2 + 2")).toEqual({ value: 4 });
      expect(engine.evalCode("10 * 3")).toEqual({ value: 30 });
      expect(engine.evalCode("100 / 4")).toEqual({ value: 25 });
    });

    it("evaluates string expressions", () => {
      expect(engine.evalCode('"hello"')).toEqual({ value: "hello" });
      expect(engine.evalCode('"hello" + " world"')).toEqual({ value: "hello world" });
    });

    it("evaluates array expressions", () => {
      expect(engine.evalCode("[1, 2, 3]")).toEqual({ value: [1, 2, 3] });
    });

    it("evaluates object expressions", () => {
      expect(engine.evalCode('({a: 1, b: 2})')).toEqual({ value: { a: 1, b: 2 } });
    });

    it("evaluates complex expressions", () => {
      expect(engine.evalCode("[1,2,3].map(x => x * 2)")).toEqual({ value: [2, 4, 6] });
      expect(engine.evalCode("[1,2,3].reduce((a,b) => a+b, 0)")).toEqual({ value: 6 });
      expect(engine.evalCode("Math.max(1, 5, 3)")).toEqual({ value: 5 });
    });

    it("evaluates boolean expressions", () => {
      expect(engine.evalCode("true")).toEqual({ value: true });
      expect(engine.evalCode("1 > 0")).toEqual({ value: true });
      expect(engine.evalCode("1 === 2")).toEqual({ value: false });
    });
  });

  describe("scope persistence", () => {
    it("persists const declarations", () => {
      engine.evalCode("const x = 42");
      expect(engine.evalCode("x")).toEqual({ value: 42 });
    });

    it("persists let declarations", () => {
      engine.evalCode("let y = 10");
      expect(engine.evalCode("y")).toEqual({ value: 10 });
    });

    it("persists multiple declarations", () => {
      engine.evalCode("const a = 1");
      engine.evalCode("const b = 2");
      expect(engine.evalCode("a + b")).toEqual({ value: 3 });
    });

    it("persists function declarations", () => {
      engine.evalCode("function double(n) { return n * 2 }");
      expect(engine.evalCode("double(5)")).toEqual({ value: 10 });
    });

    it("uses previous declarations in new ones", () => {
      engine.evalCode("const base = 10");
      engine.evalCode("const multiplied = base * 3");
      expect(engine.evalCode("multiplied")).toEqual({ value: 30 });
    });
  });

  describe("declarations return undefined", () => {
    it("const returns undefined", () => {
      expect(engine.evalCode("const x = 5")).toEqual({ value: undefined });
    });

    it("let returns undefined", () => {
      expect(engine.evalCode("let y = 10")).toEqual({ value: undefined });
    });

    it("function returns undefined", () => {
      expect(engine.evalCode("function foo() {}")).toEqual({ value: undefined });
    });
  });

  describe("error handling", () => {
    it("returns error for undefined variables", () => {
      const result = engine.evalCode("undefinedVar + 1");
      expect(result).toHaveProperty("error");
      expect((result as { error: string }).error).toContain("undefinedVar");
    });

    it("returns error for syntax errors", () => {
      const result = engine.evalCode("const = bad");
      expect(result).toHaveProperty("error");
    });

    it("returns error for thrown errors", () => {
      const result = engine.evalCode('throw new Error("boom")');
      expect(result).toHaveProperty("error");
      expect((result as { error: string }).error).toContain("boom");
    });
  });

  describe("error recovery", () => {
    it("continues working after an error", () => {
      engine.evalCode("undefinedVar"); // error
      expect(engine.evalCode("2 + 2")).toEqual({ value: 4 }); // still works
    });

    it("preserves scope after an error", () => {
      engine.evalCode("const x = 42");
      engine.evalCode("undefinedVar"); // error
      expect(engine.evalCode("x")).toEqual({ value: 42 }); // scope intact
    });

    it("continues accepting declarations after error", () => {
      engine.evalCode("badSyntax!!!"); // error
      engine.evalCode("const y = 99");
      expect(engine.evalCode("y")).toEqual({ value: 99 });
    });
  });

  describe("reset", () => {
    it("clears scope", () => {
      engine.evalCode("const x = 42");
      engine.reset();
      const result = engine.evalCode("x");
      expect(result).toHaveProperty("error");
    });
  });
});
