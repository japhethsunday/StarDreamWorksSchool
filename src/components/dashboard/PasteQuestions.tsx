"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ClipboardPaste } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { PASTE_EXAMPLE, parsePastedQuestions, type PastedQuestion } from "@/lib/question-paste";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  LONG_ANSWER: "Essay",
};

interface Props {
  existingCount: number;
  /** Called with the questions to append to the exam. */
  onAdd: (questions: PastedQuestion[]) => void;
}

/** Button + dialog for adding many questions at once by pasting text. */
export default function PasteQuestions({ existingCount, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [marks, setMarks] = useState("1");

  const parsed = useMemo(() => parsePastedQuestions(text, Number(marks) || 1), [text, marks]);
  const problems = parsed.filter((q) => q.problem).length;
  const counts = parsed.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.type]: (acc[q.type] ?? 0) + 1 }), {});

  // This dialog opens on top of the questions dialog; when it closes, keep the
  // page behind locked for the dialog that is still open.
  const relockScroll = () => setTimeout(() => (document.body.style.overflow = "hidden"), 0);

  const close = () => {
    setOpen(false);
    relockScroll();
  };

  const add = () => {
    onAdd(parsed.map((q) => ({ ...q, problem: undefined })));
    setText("");
    setOpen(false);
    relockScroll();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-navy-deep text-white text-[12px] font-bold hover:bg-brand-navy transition-colors"
      >
        <ClipboardPaste className="w-3.5 h-3.5" /> Paste questions
      </button>

      {open && typeof document !== "undefined" && createPortal(
      <Modal isOpen={open} onClose={close} title="Paste questions" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="rounded-lg bg-brand-paper border border-brand-line p-3 text-[12px] text-gray-600 space-y-1">
            <p className="font-bold text-brand-navy">How to write them</p>
            <p>Number each question. For multiple choice, put each option on its own line (A., B., C.…) and add <b>*</b> after the correct one.</p>
            <p>For true/false add <b>Answer: True</b> or <b>Answer: False</b>. For an essay question add <b>Type: Essay</b>. Anything else becomes a short answer.</p>
            <button type="button" onClick={() => setText(PASTE_EXAMPLE)} className="text-brand-red font-bold hover:underline">
              Show me an example
            </button>
          </div>

          <div className="grid sm:grid-cols-[1fr_140px] gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={"1. What is 7 + 5?\nA. 10\nB. 12 *\nC. 13\nD. 11"}
              className="w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-brand-red/40"
            />
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Marks per question</label>
              <input
                inputMode="numeric"
                value={marks}
                onChange={(e) => setMarks(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/40"
              />
              <p className="text-[11px] text-gray-400 mt-1">You can change any one afterwards.</p>
            </div>
          </div>

          {parsed.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="font-bold text-brand-navy-deep">{parsed.length} question(s) found</span>
                {Object.entries(counts).map(([t, n]) => (
                  <span key={t} className="text-gray-500">{TYPE_LABEL[t]}: {n}</span>
                ))}
                {problems > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                    <AlertTriangle className="w-4 h-4" /> {problems} need fixing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> All look good
                  </span>
                )}
              </div>

              <ol className="space-y-2">
                {parsed.map((q, i) => (
                  <li
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-[13px] ${q.problem ? "border-amber-300 bg-amber-50" : "border-brand-line"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-brand-navy-deep">
                        {existingCount + i + 1}. {q.question || <em className="text-gray-400">No question text</em>}
                      </p>
                      <span className="shrink-0 text-[11px] text-gray-400">{TYPE_LABEL[q.type]} · {q.marks} mk</span>
                    </div>
                    {q.options.length > 0 && (
                      <ul className="mt-1 grid sm:grid-cols-2 gap-x-4 text-gray-600">
                        {q.options.map((o) => (
                          <li key={o.key} className={o.isCorrect ? "text-green-700 font-bold" : ""}>
                            {o.key}. {o.text} {o.isCorrect && "✔"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === "TRUE_FALSE" && (
                      <p className="mt-1 text-green-700 font-bold">Answer: {q.correctAnswer === "true" ? "True" : "False"}</p>
                    )}
                    {q.problem && <p className="mt-1 text-amber-800 font-medium">{q.problem}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 rounded-lg border border-brand-line text-[13px] font-medium text-gray-600 hover:bg-brand-paper">
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={parsed.length === 0 || problems > 0}
              title={problems > 0 ? "Fix the highlighted questions first" : undefined}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-red text-white text-[13px] font-bold hover:bg-brand-red/90 disabled:opacity-50"
            >
              Add {parsed.length || ""} question{parsed.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </Modal>,
      document.body
      )}
    </>
  );
}
