"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOL_BTN =
  "flex h-8 w-8 items-center justify-center rounded-md text-brand-navy transition-colors hover:bg-brand-paper disabled:opacity-40 disabled:pointer-events-none";

/** Character offsets of the current selection inside `el` (null when unfocused). */
function saveSelection(el: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  return { start, end };
}

/** Restores a saved selection by character offset across all text nodes of `el`. */
function restoreSelection(el: HTMLElement, saved: { start: number; end: number } | null) {
  if (!saved) return;
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    if ((n as Text).nodeValue) textNodes.push(n as Text);
    n = walker.nextNode();
  }
  if (textNodes.length === 0) return;
  const locate = (target: number): { node: Text; offset: number } => {
    let acc = 0;
    for (const node of textNodes) {
      const len = node.nodeValue?.length ?? 0;
      if (acc + len >= target) return { node, offset: Math.min(target - acc, len) };
      acc += len;
    }
    const last = textNodes[textNodes.length - 1];
    return { node: last, offset: last.nodeValue?.length ?? 0 };
  };
  try {
    const startPos = locate(saved.start);
    const endPos = locate(saved.end);
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    el.focus();
  }
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  /** Last HTML string this editor forwarded via onChange — used to tell our own
   * echoes apart from genuine external value changes so we never rewrite the
   * DOM (and lose the caret) after every keystroke. */
  const emittedRef = useRef<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const syncState = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    emittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      syncState();
    },
    [syncState]
  );

  const pushHistory = useCallback(() => {
    const current = editorRef.current?.innerHTML ?? "";
    setHistory((h) => [...h.slice(-49), current]);
    setFuture([]);
  }, []);

  const handleInput = useCallback(() => {
    syncState();
  }, [syncState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "y")) {
        e.preventDefault();
        if (e.key === "z") {
          const prev = history[history.length - 1];
          if (prev === undefined) return;
          const current = editorRef.current?.innerHTML ?? "";
          setFuture((f) => [current, ...f].slice(0, 50));
          setHistory((h) => h.slice(0, -1));
          if (editorRef.current) {
            editorRef.current.innerHTML = prev;
            syncState();
          }
        } else {
          const next = future[0];
          if (next === undefined) return;
          const current = editorRef.current?.innerHTML ?? "";
          setHistory((h) => [...h, current]);
          setFuture((f) => f.slice(1));
          if (editorRef.current) {
            editorRef.current.innerHTML = next;
            syncState();
          }
        }
      }
    },
    [history, future, syncState]
  );

  /* On every render, only scribe the DOM when the value genuinely changed
   * OUTSIDE our own typing (e.g. an external reset). Echoes from onChange are
   * skipped so the browser's selection inside the contenteditable stays put. */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const incoming = value ?? "";
    if (incoming === emittedRef.current) return;
    const saved = saveSelection(el);
    el.innerHTML = incoming;
    emittedRef.current = incoming;
    restoreSelection(el, saved);
  }, [value]);

  const insertLink = useCallback(() => {
    const url = window.prompt("Enter the link URL", "https://");
    if (!url) return;
    exec("createLink", url);
  }, [exec]);

  const addHeading = useCallback(
    (tag: string) => {
      editorRef.current?.focus();
      const selection = window.getSelection();
      let range: Range | null = null;
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }
      // Wrap the current block (or selection) in the heading tag.
      try {
        if (range && !range.collapsed) {
          const block = document.createElement(tag);
          try {
            range.surroundContents(block);
          } catch {
            // Complex selections can't be surrounded — fall back to execCommand.
            document.execCommand("formatBlock", false, tag);
          }
        } else {
          document.execCommand("formatBlock", false, tag);
        }
      } catch {
        document.execCommand("formatBlock", false, tag);
      }
      syncState();
    },
    [syncState]
  );

  return (
    <div className="rounded-xl border border-brand-line bg-white overflow-hidden focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-shadow">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-brand-line bg-brand-paper/60">
        <button type="button" title="Undo" className={TOOL_BTN} onClick={pushHistory}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" title="Redo" className={TOOL_BTN} onClick={pushHistory}>
          <Redo2 className="w-4 h-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-brand-line" />
        <button type="button" title="Bold" className={TOOL_BTN} onClick={() => exec("bold")}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" title="Italic" className={TOOL_BTN} onClick={() => exec("italic")}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" title="Underline" className={TOOL_BTN} onClick={() => exec("underline")}>
          <Underline className="w-4 h-4" />
        </button>
        <button type="button" title="Strikethrough" className={TOOL_BTN} onClick={() => exec("strikeThrough")}>
          <Strikethrough className="w-4 h-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-brand-line" />
        <button type="button" title="Sub-heading" className={TOOL_BTN} onClick={() => addHeading("h2")}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" title="Small heading" className={TOOL_BTN} onClick={() => addHeading("h3")}>
          <Heading3 className="w-4 h-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-brand-line" />
        <button type="button" title="Bullet list" className={TOOL_BTN} onClick={() => exec("insertUnorderedList")}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" title="Numbered list" className={TOOL_BTN} onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <button type="button" title="Quote" className={TOOL_BTN} onClick={() => exec("formatBlock", "blockquote")}>
          <Quote className="w-4 h-4" />
        </button>
        <button type="button" title="Insert link" className={TOOL_BTN} onClick={insertLink}>
          <Link2 className="w-4 h-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-brand-line" />
        <button type="button" title="Align left" className={TOOL_BTN} onClick={() => exec("justifyLeft")}>
          <AlignLeft className="w-4 h-4" />
        </button>
        <button type="button" title="Align center" className={TOOL_BTN} onClick={() => exec("justifyCenter")}>
          <AlignCenter className="w-4 h-4" />
        </button>
        <button type="button" title="Align right" className={TOOL_BTN} onClick={() => exec("justifyRight")}>
          <AlignRight className="w-4 h-4" />
        </button>
        <button type="button" title="Clear formatting" className={TOOL_BTN} onClick={() => exec("removeFormat")}>
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[220px] max-h-[380px] overflow-y-auto px-4 py-3 text-sm text-brand-body leading-relaxed outline-none"
        data-placeholder={placeholder || "Write your email content here…"}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      <style jsx global>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
      <style jsx global>{`
        [contenteditable] h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #131a3e;
          margin: 0.5rem 0;
          font-family: Poppins, Inter, Arial, sans-serif;
        }
        [contenteditable] h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #131a3e;
          margin: 0.4rem 0;
          font-family: Poppins, Inter, Arial, sans-serif;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.4rem;
          margin: 0.4rem 0;
        }
        [contenteditable] ul {
          list-style: disc;
        }
        [contenteditable] ol {
          list-style: decimal;
        }
        [contenteditable] blockquote {
          border-left: 3px solid #f5b301;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          color: #3f4756;
          font-style: italic;
        }
        [contenteditable] a {
          color: #1e7a4c;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}