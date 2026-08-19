/** Tinkerbell-style "spelled out" title reveal: each letter pops in in
 * sequence with its own small sparkle flash, like a wand tracing the
 * words, ending with a bigger sparkle burst right after the last letter.
 * Pure CSS timing (per-letter `--delay` custom property) computed here at
 * render time — no client JS needed. */

const STAGGER_SECONDS = 0.045;
const LETTER_DURATION_SECONDS = 0.5;

function Letters({ text, startIndex }: { text: string; startIndex: number }) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={startIndex + i}
          className="letter-spell-in"
          style={{ "--delay": `${(startIndex + i) * STAGGER_SECONDS}s` } as React.CSSProperties}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </>
  );
}

export function SpelledOutTitle({ line1, line2 }: { line1: string; line2: string }) {
  const totalChars = line1.length + line2.length;
  const burstDelay = `${totalChars * STAGGER_SECONDS + LETTER_DURATION_SECONDS * 0.5}s`;

  return (
    <div className="relative mt-2 inline-block">
      <h1 className="font-serif-elegant text-[2.75rem] italic leading-[1.05] text-[var(--color-charcoal)] [text-shadow:0_2px_18px_rgba(250,246,238,0.9)]">
        <Letters text={line1} startIndex={0} />
        <br />
        <Letters text={line2} startIndex={line1.length} />
        <span className="hero-burst" style={{ "--delay": burstDelay } as React.CSSProperties} aria-hidden="true">
          <span style={{ "--burst-angle": "-75deg" } as React.CSSProperties} />
          <span style={{ "--burst-angle": "-45deg" } as React.CSSProperties} />
          <span style={{ "--burst-angle": "-15deg" } as React.CSSProperties} />
          <span style={{ "--burst-angle": "15deg" } as React.CSSProperties} />
          <span style={{ "--burst-angle": "45deg" } as React.CSSProperties} />
          <span style={{ "--burst-angle": "75deg" } as React.CSSProperties} />
        </span>
      </h1>
    </div>
  );
}
