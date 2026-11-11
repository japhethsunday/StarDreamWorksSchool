// Reads exam questions pasted as plain text (from Word, WhatsApp, etc.).
//
//   1. What is 7 + 5?
//   A. 10
//   B. 12 *
//   C. 13
//
//   2. A triangle has 3 sides.
//   Answer: True
//
//   3. Explain photosynthesis.
//   Type: Essay
//
// Multiple choice: lines starting A–H; mark the correct one with "*" (or add
// "Answer: B"). True/false: "Answer: True" / "Answer: False". Anything else is
// a short answer, or a long answer with "Type: Essay" / "Type: Long".

export interface PastedOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface PastedQuestion {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER";
  question: string;
  marks: number;
  correctAnswer?: string;
  options: PastedOption[];
  /** Human-readable problem, if the question needs fixing before it can be added. */
  problem?: string;
}

const QUESTION_START = /^\s*(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[.):\-]\s*(.*)$/i;
const OPTION_LINE = /^\s*\(?([A-Ha-h])\s*[.)\]:\-]\s*(.+)$/;
const ANSWER_LINE = /^\s*(?:ans(?:wer)?|correct(?:\s+answer)?)\s*[:\-=]\s*(.+)$/i;
const TYPE_LINE = /^\s*type\s*[:\-=]\s*(.+)$/i;
const MARKS_LINE = /^\s*(?:marks?|points?)\s*[:\-=]\s*(\d+(?:\.\d+)?)\s*$/i;
const CORRECT_MARK = /\s*(?:\*+|\(correct\)|✔|✓)\s*$/i;

function blocksOf(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[][] = [];
  let current: string[] | null = null;
  const numbered = lines.some((l) => QUESTION_START.test(l));

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ").trimEnd();
    if (numbered) {
      if (QUESTION_START.test(line) && !OPTION_LINE.test(line)) {
        current = [line];
        blocks.push(current);
      } else if (current && line.trim()) {
        current.push(line);
      }
    } else {
      // No numbering: blank lines separate questions.
      if (!line.trim()) {
        current = null;
      } else {
        if (!current) {
          current = [];
          blocks.push(current);
        }
        current.push(line);
      }
    }
  }
  return blocks;
}

function parseBlock(lines: string[], defaultMarks: number): PastedQuestion {
  const first = lines[0];
  const m = first.match(QUESTION_START);
  let questionText = (m ? m[2] : first).trim();
  const options: PastedOption[] = [];
  let answer: string | null = null;
  let typeHint: string | null = null;
  let marks = defaultMarks;

  for (const line of lines.slice(1)) {
    const opt = line.match(OPTION_LINE);
    const ans = line.match(ANSWER_LINE);
    const typ = line.match(TYPE_LINE);
    const mk = line.match(MARKS_LINE);
    if (ans) answer = ans[1].trim();
    else if (typ) typeHint = typ[1].trim().toLowerCase();
    else if (mk) marks = Math.max(1, Math.round(Number(mk[1])));
    else if (opt) {
      let text = opt[2].trim();
      const isCorrect = CORRECT_MARK.test(text);
      text = text.replace(CORRECT_MARK, "").trim();
      options.push({ key: opt[1].toUpperCase(), text, isCorrect });
    } else if (options.length === 0) {
      // Question text that wraps onto more lines.
      questionText = `${questionText} ${line.trim()}`.trim();
    } else {
      // Option text that wraps onto more lines.
      const last = options[options.length - 1];
      last.text = `${last.text} ${line.trim()}`.trim();
    }
  }

  // Strip a trailing "(2 marks)" from the question itself.
  const inlineMarks = questionText.match(/\((\d+)\s*marks?\)\s*$/i);
  if (inlineMarks) {
    marks = Math.max(1, Number(inlineMarks[1]));
    questionText = questionText.replace(inlineMarks[0], "").trim();
  }

  const base = { question: questionText, marks };
  if (!questionText) return { ...base, type: "SHORT_ANSWER", options: [], problem: "Question text is missing." };

  if (options.length > 0) {
    // Re-letter options A, B, C… so keys are always clean and unique.
    const lettered = options.map((o, i) => ({ ...o, key: String.fromCharCode(65 + i) }));
    if (answer && !lettered.some((o) => o.isCorrect)) {
      const a = answer.replace(/[^a-z]/gi, "").toUpperCase();
      const byLetter = options.findIndex((o) => o.key === a.charAt(0) && a.length === 1);
      const byText = lettered.findIndex((o) => o.text.toLowerCase() === answer!.toLowerCase());
      const idx = byLetter >= 0 ? byLetter : byText;
      if (idx >= 0) lettered[idx].isCorrect = true;
    }
    const correct = lettered.filter((o) => o.isCorrect);
    let problem: string | undefined;
    if (lettered.length < 2) problem = "Multiple choice needs at least two options.";
    else if (correct.length === 0) problem = "Mark the correct option with * (e.g. \"B. 12 *\").";
    else if (correct.length > 1) problem = "Only one option can be marked correct.";
    if (correct.length > 1) lettered.forEach((o, i) => (o.isCorrect = i === lettered.indexOf(correct[0])));
    return {
      ...base,
      type: "MULTIPLE_CHOICE",
      options: lettered,
      correctAnswer: lettered.find((o) => o.isCorrect)?.key,
      problem,
    };
  }

  if (answer && /^(true|false|t|f|yes|no)$/i.test(answer)) {
    const isTrue = /^(true|t|yes)$/i.test(answer);
    return { ...base, type: "TRUE_FALSE", options: [], correctAnswer: isTrue ? "true" : "false" };
  }

  const long = typeHint ? /essay|long|theory|explain/.test(typeHint) : false;
  return { ...base, type: long ? "LONG_ANSWER" : "SHORT_ANSWER", options: [] };
}

export function parsePastedQuestions(text: string, defaultMarks = 1): PastedQuestion[] {
  const marks = Number.isFinite(defaultMarks) && defaultMarks > 0 ? Math.round(defaultMarks) : 1;
  return blocksOf(text).map((b) => parseBlock(b, marks));
}

export const PASTE_EXAMPLE = `1. What is 7 + 5?
A. 10
B. 12 *
C. 13
D. 11

2. A triangle has 3 sides.
Answer: True

3. Name the capital of Nigeria.

4. Explain why we need clean water.
Type: Essay`;
