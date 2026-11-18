/**
 * Small dependency-free SVG charts. Marks follow one spec: columns capped at 24px
 * with 4px rounded tops, 2px lines, recessive 1px grid, one y-axis, hover tooltips.
 * Colors come from CSS tokens (--series-1, --series-2) so light/dark both apply.
 */
import { esc, fmt } from './ui';

export interface Series {
  key: string;
  label: string;
  color: string; // CSS color, usually var(--series-n)
}

type Row = Record<string, string | number>;

const W = 720;
const PAD = { top: 12, right: 8, bottom: 26, left: 40 };

/** Smallest "round" axis top at or above v, split into 4 equal steps (e.g. 115 → 120, 7 → 8). */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const raw = v / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * pow >= raw)! * pow;
  return Math.ceil(step) * 4;
}

function axis(max: number, height: number) {
  const innerH = height - PAD.top - PAD.bottom;
  return [0, 1, 2, 3, 4]
    .map((i) => {
      const v = (max / 4) * i;
      const y = PAD.top + innerH - (innerH * i) / 4;
      return `<line class="grid-line" x1="${PAD.left}" x2="${W - PAD.right}" y1="${y}" y2="${y}"/>
        <text class="axis-text" x="${PAD.left - 8}" y="${y + 4}" text-anchor="end">${fmt.compact(Math.round(v * 100) / 100)}</text>`;
    })
    .join('');
}

function xLabels(rows: Row[], xKey: string, xOf: (i: number) => number, height: number, format: (v: string) => string) {
  const n = rows.length;
  const every = Math.max(1, Math.ceil(n / 7));
  return rows
    .map((r, i) =>
      i % every === 0 || i === n - 1
        ? `<text class="axis-text" x="${xOf(i)}" y="${height - 6}" text-anchor="middle">${esc(format(String(r[xKey])))}</text>`
        : '',
    )
    .join('');
}

function tooltipHtml(title: string, series: Series[], row: Row) {
  return `<strong>${esc(title)}</strong>${series
    .map((s) => `<div class="row"><span><i style="background:${s.color}"></i>${esc(s.label)}</span><b>${fmt.n(row[s.key])}</b></div>`)
    .join('')}`;
}

function attachHover(
  host: HTMLElement,
  svg: SVGSVGElement,
  count: number,
  xOf: (i: number) => number,
  content: (i: number) => string,
  crosshair: boolean,
) {
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.hidden = true;
  host.append(tip);
  const line = svg.querySelector<SVGLineElement>('.crosshair');
  const hit = svg.querySelector<SVGRectElement>('.hit')!;
  const step = (W - PAD.left - PAD.right) / Math.max(count, 1);

  const show = (clientX: number) => {
    const box = svg.getBoundingClientRect();
    const scale = box.width / W;
    const x = (clientX - box.left) / scale;
    const i = Math.min(count - 1, Math.max(0, Math.floor((x - PAD.left) / step)));
    tip.innerHTML = content(i);
    tip.hidden = false;
    const px = xOf(i) * scale;
    const tipW = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(px - tipW / 2, 0), box.width - tipW)}px`;
    tip.style.top = `${-8 - tip.offsetHeight + PAD.top * scale}px`;
    if (line && crosshair) {
      line.setAttribute('x1', String(xOf(i)));
      line.setAttribute('x2', String(xOf(i)));
      line.style.display = '';
    }
    svg.querySelectorAll<SVGElement>('[data-i]').forEach((el) => {
      el.style.opacity = el.dataset.i === String(i) ? '1' : crosshair ? '1' : '0.55';
    });
  };
  const hide = () => {
    tip.hidden = true;
    if (line) line.style.display = 'none';
    svg.querySelectorAll<SVGElement>('[data-i]').forEach((el) => (el.style.opacity = '1'));
  };
  hit.addEventListener('pointermove', (e) => show(e.clientX));
  hit.addEventListener('pointerdown', (e) => show(e.clientX));
  hit.addEventListener('pointerleave', hide);
}

function legend(series: Series[]) {
  if (series.length < 2) return '';
  return `<div class="chart-legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>`;
}

/** Vertical columns for one series over time. */
export function columnChart(
  host: HTMLElement,
  rows: Row[],
  opts: { x: string; series: Series; height?: number; formatX?: (v: string) => string; ariaLabel: string },
) {
  const height = opts.height ?? 220;
  const max = niceMax(Math.max(0, ...rows.map((r) => Number(r[opts.series.key]) || 0)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const step = innerW / Math.max(rows.length, 1);
  const barW = Math.min(24, Math.max(2, step - 2));
  const xOf = (i: number) => PAD.left + step * i + step / 2;
  const formatX = opts.formatX ?? fmt.shortDay;
  const r = Math.min(4, barW / 2);

  const bars = rows
    .map((row, i) => {
      const v = Number(row[opts.series.key]) || 0;
      if (v <= 0) return '';
      const h = Math.max(1.5, (v / max) * innerH);
      const x = xOf(i) - barW / 2;
      const y = PAD.top + innerH - h;
      const rr = Math.min(r, h);
      // Rounded data end (top), square at the baseline.
      return `<path data-i="${i}" fill="${opts.series.color}" d="M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + barW - rr} Q${x + barW},${y} ${x + barW},${y + rr} V${y + h} Z"/>`;
    })
    .join('');

  host.innerHTML = `<div class="chart"><svg viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(opts.ariaLabel)}">
    ${axis(max, height)}${bars}${xLabels(rows, opts.x, xOf, height, formatX)}
    <rect class="hit" x="${PAD.left}" y="0" width="${innerW}" height="${height}"/>
  </svg></div>`;
  const chart = host.querySelector<HTMLElement>('.chart')!;
  attachHover(chart, chart.querySelector('svg')!, rows.length, xOf, (i) => tooltipHtml(formatX(String(rows[i][opts.x])), [opts.series], rows[i]), false);
}

/** One or two lines over time (same unit, one axis). */
export function lineChart(
  host: HTMLElement,
  rows: Row[],
  opts: { x: string; series: Series[]; height?: number; formatX?: (v: string) => string; ariaLabel: string; area?: boolean },
) {
  const height = opts.height ?? 240;
  const max = niceMax(Math.max(0, ...rows.flatMap((r) => opts.series.map((s) => Number(r[s.key]) || 0))));
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const step = innerW / Math.max(rows.length, 1);
  const xOf = (i: number) => PAD.left + step * i + step / 2;
  const yOf = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const formatX = opts.formatX ?? fmt.shortDay;

  const paths = opts.series
    .map((s, si) => {
      const pts = rows.map((r, i) => `${xOf(i).toFixed(1)},${yOf(Number(r[s.key]) || 0).toFixed(1)}`);
      const area =
        opts.area && si === 0 && rows.length > 1
          ? `<path d="M${xOf(0)},${PAD.top + innerH} L${pts.join(' L')} L${xOf(rows.length - 1)},${PAD.top + innerH} Z" fill="${s.color}" opacity="0.1"/>`
          : '';
      const last = rows.length - 1;
      const end =
        last >= 0
          ? `<circle cx="${xOf(last)}" cy="${yOf(Number(rows[last][s.key]) || 0)}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`
          : '';
      return `${area}<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${end}`;
    })
    .join('');

  host.innerHTML = `${legend(opts.series)}<div class="chart"><svg viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(opts.ariaLabel)}">
    ${axis(max, height)}
    <line class="crosshair" y1="${PAD.top}" y2="${PAD.top + innerH}" style="display:none"/>
    ${paths}${xLabels(rows, opts.x, xOf, height, formatX)}
    <rect class="hit" x="${PAD.left}" y="0" width="${innerW}" height="${height}"/>
  </svg></div>`;
  const chart = host.querySelector<HTMLElement>('.chart')!;
  attachHover(chart, chart.querySelector('svg')!, rows.length, xOf, (i) => tooltipHtml(formatX(String(rows[i][opts.x])), opts.series, rows[i]), true);
}

/** Ranked horizontal bars with labels and values (screens, countries, events). */
export function barList(
  host: HTMLElement,
  items: { label: string; value: number; sub?: string }[],
  opts: { empty?: string; format?: (v: number) => string } = {},
) {
  if (!items.length) {
    host.innerHTML = `<p class="muted">${esc(opts.empty ?? 'No data yet.')}</p>`;
    return;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  const format = opts.format ?? fmt.n;
  host.innerHTML = `<div class="barlist">${items
    .map(
      (i) => `<div class="barlist-row" title="${esc(i.label)}: ${esc(format(i.value))}">
        <span class="label">${esc(i.label)}${i.sub ? ` <span class="muted">${esc(i.sub)}</span>` : ''}</span>
        <span class="value">${esc(format(i.value))}</span>
        <span class="bar"><i style="width:${Math.max(2, (i.value / max) * 100)}%"></i></span>
      </div>`,
    )
    .join('')}</div>`;
}

/** A single stacked bar showing parts of a whole, with a legend carrying names and shares. */
export function segmentBar(host: HTMLElement, parts: { label: string; value: number; color: string }[]) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) {
    host.innerHTML = '<p class="muted">No data yet.</p>';
    return;
  }
  host.innerHTML = `<div class="segbar" role="img" aria-label="${esc(parts.map((p) => `${p.label} ${fmt.pct(p.value / total)}`).join(', '))}">${parts
    .filter((p) => p.value > 0)
    .map((p) => `<i style="width:${(p.value / total) * 100}%;background:${p.color}" title="${esc(p.label)}: ${fmt.n(p.value)}"></i>`)
    .join('')}</div>
    <div class="seg-legend">${parts
      .map((p) => `<span><i style="background:${p.color}"></i>${esc(p.label)} <b>${fmt.pct(p.value / total)}</b> <span class="muted">(${fmt.n(p.value)})</span></span>`)
      .join('')}</div>`;
}
