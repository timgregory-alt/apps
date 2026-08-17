"use client";

import { useRef, useState } from "react";

function parseIso(value: string): { month: string; day: string; year: string } {
  if (!value) return { month: "", day: "", year: "" };
  const [y, m, d] = value.split("-");
  return { month: m ?? "", day: d ?? "", year: y ?? "" };
}

const inputClass =
  "h-12 rounded-xl border border-[var(--color-line)] bg-white/70 text-center text-[var(--color-charcoal)] outline-none transition-colors placeholder:text-[var(--color-charcoal)]/35 focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/25 disabled:cursor-not-allowed disabled:opacity-60";

/** A typeable MM / DD / YYYY birthdate entry — avoids the native date input's
 * scroll-wheel picker on mobile. Emits (and accepts) an ISO "YYYY-MM-DD" string,
 * only once all three parts are fully entered. */
export function DateOfBirthInput({
  value,
  onChange,
  disabled,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const parsed = parseIso(value);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);
  const [year, setYear] = useState(parsed.year);

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  function emit(m: string, d: string, y: string) {
    onChange(m.length === 2 && d.length === 2 && y.length === 4 ? `${y}-${m}-${d}` : "");
  }

  function handleMonth(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setMonth(digits);
    emit(digits, day, year);
    if (digits.length === 2) dayRef.current?.focus();
  }

  function handleDay(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setDay(digits);
    emit(month, digits, year);
    if (digits.length === 2) yearRef.current?.focus();
  }

  function handleYear(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    emit(month, day, digits);
  }

  return (
    <div className="flex gap-2">
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-month"
        placeholder="MM"
        value={month}
        onChange={(e) => handleMonth(e.target.value)}
        disabled={disabled}
        required={required}
        maxLength={2}
        aria-label="Birth month"
        className={`${inputClass} w-16`}
      />
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-day"
        placeholder="DD"
        value={day}
        onChange={(e) => handleDay(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && day === "") monthRef.current?.focus();
        }}
        disabled={disabled}
        required={required}
        maxLength={2}
        aria-label="Birth day"
        className={`${inputClass} w-16`}
      />
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        autoComplete="bday-year"
        placeholder="YYYY"
        value={year}
        onChange={(e) => handleYear(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && year === "") dayRef.current?.focus();
        }}
        disabled={disabled}
        required={required}
        maxLength={4}
        aria-label="Birth year"
        className={`${inputClass} w-20`}
      />
    </div>
  );
}
