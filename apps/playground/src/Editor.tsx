import { useEffect, useRef } from "react";
import { chamebrushParser } from "@chamebrush/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  codeFolding,
  delimitedIndent,
  foldGutter,
  foldInside,
  foldKeymap,
  foldNodeProp,
  HighlightStyle,
  indentNodeProp,
  indentOnInput,
  LanguageSupport,
  LRLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { setDiagnostics, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";

interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  range: { from: number; to: number };
}

interface EditorProps {
  value: string;
  diagnostics: Diagnostic[];
  onChange(value: string): void;
}

const language = LRLanguage.define({
  name: "chamebrush",
  parser: chamebrushParser.configure({
    props: [
      indentNodeProp.add({
        "ObjectBody AnimationBody": delimitedIndent({ closing: "}", align: false }),
        ListExpression: delimitedIndent({ closing: "]", align: false }),
      }),
      foldNodeProp.add({
        "ObjectBody AnimationBody ListExpression": foldInside,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    closeBrackets: { brackets: ["(", "[", "{", "\""] },
  },
});

const languageSupport = new LanguageSupport(language);

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c792ea", fontWeight: "600" },
  { tag: tags.typeName, color: "#c792ea", fontWeight: "600" },
  { tag: tags.propertyName, color: "#c3e88d", fontWeight: "500" },
  { tag: tags.definition(tags.variableName), color: "#82aaff" },
  { tag: tags.string, color: "#ecc48d" },
  { tag: tags.number, color: "#f78c6c" },
  { tag: tags.bool, color: "#ff5874" },
  { tag: tags.comment, color: "#637777", fontStyle: "italic" },
  { tag: tags.variableName, color: "#82aaff" },
]);

function toCodeMirrorDiagnostics(diagnostics: Diagnostic[], length: number): CmDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    from: Math.min(diagnostic.range.from, length),
    to: Math.min(Math.max(diagnostic.range.to, diagnostic.range.from + 1), length),
    severity: diagnostic.severity,
    message: diagnostic.message,
  }));
}

export function Editor({ value, diagnostics, onChange }: EditorProps) {
  const container = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!container.current) return;
    const editor = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          languageSupport,
          indentOnInput(),
          bracketMatching(),
          codeFolding(),
          foldGutter(),
          syntaxHighlighting(highlight),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...foldKeymap]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%", backgroundColor: "#0b101c", color: "#d6deeb" },
            ".cm-scroller": { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace', fontSize: "13px", lineHeight: "1.65" },
            ".cm-content": { padding: "16px 0" },
            ".cm-gutters": { backgroundColor: "#0b101c", color: "#53627a", border: "none", paddingLeft: "6px" },
            ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#162033" },
            ".cm-cursor": { borderLeftColor: "#ffffff" },
          }),
        ],
      }),
    });
    view.current = editor;
    return () => editor.destroy();
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current !== value) editor.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    editor.dispatch(setDiagnostics(editor.state, toCodeMirrorDiagnostics(diagnostics, editor.state.doc.length)));
  }, [value, diagnostics]);

  return <div className="code-editor" ref={container} aria-label="Chamebrush source editor" />;
}
