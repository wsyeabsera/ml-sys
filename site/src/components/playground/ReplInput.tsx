import { useCallback, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
interface ReplInputProps {
  onExecute: (code: string) => void;
  onNavigateHistory: (direction: "up" | "down") => string | null;
  disabled: boolean;
}

const editorStyles = EditorView.theme({
  "&": {
    fontSize: "13px",
    backgroundColor: "transparent !important",
    color: "var(--color-text-primary)",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-content": {
    padding: "0",
  },
  ".cm-line": {
    padding: "0",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  ".cm-placeholder": {
    color: "var(--color-text-muted)",
  },
});

export default function ReplInput({
  onExecute,
  onNavigateHistory,
  disabled,
}: ReplInputProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  const onExecuteRef = useRef(onExecute);
  onExecuteRef.current = onExecute;
  const onNavRef = useRef(onNavigateHistory);
  onNavRef.current = onNavigateHistory;

  const extensions = useCallback(
    () => [
      javascript({ typescript: true }),
      editorStyles,
      Prec.highest(
        keymap.of([
          {
            key: "Shift-Enter",
            run: (view) => {
              const code = view.state.doc.toString();
              if (code.trim()) {
                onExecuteRef.current(code);
                view.dispatch({
                  changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: "",
                  },
                });
              }
              return true;
            },
          },
          {
            key: "ArrowUp",
            run: (view) => {
              const cursor = view.state.selection.main.head;
              const line = view.state.doc.lineAt(cursor);
              if (line.number === 1) {
                const prev = onNavRef.current("up");
                if (prev !== null) {
                  view.dispatch({
                    changes: {
                      from: 0,
                      to: view.state.doc.length,
                      insert: prev,
                    },
                    selection: { anchor: prev.length },
                  });
                  return true;
                }
              }
              return false;
            },
          },
          {
            key: "ArrowDown",
            run: (view) => {
              const cursor = view.state.selection.main.head;
              const line = view.state.doc.lineAt(cursor);
              if (line.number === view.state.doc.lines) {
                const next = onNavRef.current("down");
                if (next !== null) {
                  view.dispatch({
                    changes: {
                      from: 0,
                      to: view.state.doc.length,
                      insert: next,
                    },
                    selection: { anchor: next.length },
                  });
                  return true;
                }
              }
              return false;
            },
          },
        ]),
      ),
    ],
    [],
  );

  return (
    <div className="border border-[var(--color-surface-overlay)] rounded-lg bg-[var(--color-surface-raised)] px-3 py-2 flex items-start gap-2">
      <span className="text-[var(--color-accent-blue)] font-mono text-sm mt-0.5 select-none">
        {">"}
      </span>
      <div className="flex-1 min-w-0">
        <CodeMirror
          ref={cmRef}
          value=""
          theme="dark"
          extensions={extensions()}
          placeholder={
            disabled
              ? "Bridge not connected..."
              : "Type JS or an MCP tool call... (Shift+Enter to run)"
          }
          editable={!disabled}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            history: true,
          }}
        />
      </div>
    </div>
  );
}
