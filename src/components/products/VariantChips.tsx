"use client";

import { useLayoutEffect, useRef, useState } from "react";
import "./VariantChips.css";

const GAP = 5; // keep in step with the CSS column gap
const MORE_WIDTH = 30; // room kept for the "+N" chip

/**
 * The pack sizes of a product as small chips instead of a dropdown. They wrap onto at most `maxRows` lines (one by default); sizes that do not
 * fit are replaced by a "+N" chip (onMore opens the full size picker).
 */
export default function VariantChips({ variants, selected, onSelect, onMore, name, maxRows = 1 }: {
  variants: { label: string }[];
  selected: number;
  onSelect: (index: number) => void;
  onMore?: () => void;
  name: string;
  maxRows?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const key = variants.map(v => v.label).join("|");
  const [width, setWidth] = useState(0);
  const [fit, setFit] = useState<{ key: string; width: number; count: number } | null>(null);
  const measured = fit !== null && fit.key === key && fit.width === width && width > 0;

  // follow the width of the card
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // pass 1 shows every chip (hidden), measures the rows, and works out how many chips fit in `maxRows` lines together with "+N"
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || measured || width === 0) return;
    const chips = [...el.querySelectorAll<HTMLElement>("[data-chip]")];
    const tops = [...new Set(chips.map(c => c.offsetTop))].sort((a, b) => a - b);
    const rowOf = (c: HTMLElement) => tops.indexOf(c.offsetTop);
    let count = chips.filter(c => rowOf(c) < maxRows).length;
    if (count < chips.length) {
      const rowUsed = (limit: number, row: number) => chips.slice(0, limit).filter(c => rowOf(c) === row).reduce((sum, c) => sum + c.offsetWidth + GAP, 0);
      while (count > 1 && rowUsed(count, rowOf(chips[count - 1])) + MORE_WIDTH > width) count--;
    }
    setFit({ key, width, count });
  }, [measured, width, key, maxRows]);

  const total = variants.length;
  const count = measured ? fit.count : total;
  const shown = Array.from({ length: count }, (_, i) => i);
  // the chosen size always stays visible
  if (measured && selected >= count && count > 0) shown[count - 1] = selected;
  const hidden = total - count;

  return (
    <div ref={box} className={`variant-chips${measured ? "" : " is-measuring"}`} role="radiogroup" aria-label={`Sizes for ${name}`}>
      {shown.map((i, position) => (
        <button type="button" role="radio" aria-checked={i === selected} data-chip key={`${i}-${variants[i].label}`} className={`variant-chip${i === selected ? " is-selected" : ""}`} onClick={() => onSelect(i)}>
          {variants[i].label}
          {/* a real comma (not a CSS ::after): section styles that decorate button::after would hide it */}
          {(position < shown.length - 1 || hidden > 0) && <span className="variant-comma" aria-hidden="true">,</span>}
        </button>
      ))}
      {hidden > 0 && <button type="button" className="variant-chip variant-chip--more" onClick={onMore} aria-label={`${hidden} more sizes`}>+{hidden}</button>}
    </div>
  );
}
