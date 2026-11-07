import { Fragment } from "react";

const BREAK_AFTER = /([→↔∞⊂∅≠=∴>.])/u;

/** Renders an extract with line-break opportunities after its symbols, so it wraps between ideas, not inside words. */
export function Extract({ text, className = "extract", as: Tag = "span", id }: {
  text: string;
  className?: string;
  as?: "span" | "p";
  id?: string;
}) {
  const parts = text.split(BREAK_AFTER);
  return (
    <Tag className={className} id={id}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {BREAK_AFTER.test(p) && <wbr />}
        </Fragment>
      ))}
    </Tag>
  );
}
