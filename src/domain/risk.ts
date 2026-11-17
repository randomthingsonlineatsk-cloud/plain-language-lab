// Risk communication: absolute and relative risk, number needed to treat or harm, natural
// frequencies, the EU frequency terms for side effects, icon arrays, and checks for the number
// habits that mislead lay readers (relative risk alone, percentages of percentages, mixed
// denominators, a frequency word that does not match its number, p-values in lay text).

export interface RiskCompare { control: number; treated: number; denom: number }
export function riskNumbers(r: RiskCompare) {
  const a = r.control / r.denom, b = r.treated / r.denom
  const arr = a - b, rrr = a ? arr / a : 0, rr = a ? b / a : 0
  const nnt = arr !== 0 ? Math.ceil(1 / Math.abs(arr)) : Infinity
  const pct = (x: number) => `${Math.round(x * 1000) / 10}%`
  return {
    arr, rrr, rr, nnt, harm: arr < 0,
    relative: arr >= 0 ? `cuts the risk by ${pct(rrr)}` : `raises the risk by ${pct(-rrr)}`,
    absolute: `${r.control} in ${r.denom.toLocaleString('en-US')} without treatment and ${r.treated} in ${r.denom.toLocaleString('en-US')} with it`,
    difference: `${Math.abs(r.control - r.treated)} ${arr >= 0 ? 'fewer' : 'more'} ${Math.abs(r.control - r.treated) === 1 ? 'person' : 'people'} in every ${r.denom.toLocaleString('en-US')}`,
    nntText: isFinite(nnt) ? `${nnt} people need to be treated for one ${arr >= 0 ? 'to be helped' : 'to be harmed'} (number needed to ${arr >= 0 ? 'treat' : 'harm'})` : 'No difference',
  }
}

/** A percentage as a natural frequency, using a denominator readers can picture. */
export function naturalFrequency(pct: number): string {
  if (pct <= 0) return 'none'
  if (pct >= 1) { const n = Math.round(pct); return `about ${n} in 100 people` }
  if (pct >= 0.1) return `about ${Math.round(pct * 10)} in 1,000 people`
  return `about ${Math.max(1, Math.round(pct * 100))} in 10,000 people`
}

// EU frequency convention for side effects (as used in SmPCs and package leaflets).
export const EU_FREQUENCY = [
  { term: 'very common', min: 10, max: 100, words: 'may affect more than 1 in 10 people' },
  { term: 'common', min: 1, max: 10, words: 'may affect up to 1 in 10 people' },
  { term: 'uncommon', min: 0.1, max: 1, words: 'may affect up to 1 in 100 people' },
  { term: 'rare', min: 0.01, max: 0.1, words: 'may affect up to 1 in 1,000 people' },
  { term: 'very rare', min: 0, max: 0.01, words: 'may affect up to 1 in 10,000 people' },
]
export const frequencyTerm = (pct: number) => EU_FREQUENCY.find((f) => pct >= f.min && (pct < f.max || f.max === 100))!

/** An icon array: `count` of `total` figures highlighted, as an SVG string. */
export function iconArray(count: number, total = 100, opts: { label?: string; color?: string; per?: number } = {}): string {
  const per = opts.per ?? (total === 1000 ? 40 : 10), rows = Math.ceil(total / per), s = total === 1000 ? 9 : 22
  const W = per * s, H = rows * s + (opts.label ? 24 : 0)
  const fig = (x: number, y: number, on: boolean) => `<g transform="translate(${x},${y})" fill="${on ? opts.color ?? '#d9822b' : '#c9ced6'}"><circle cx="${s / 2}" cy="${s * 0.25}" r="${s * 0.18}"/><rect x="${s * 0.3}" y="${s * 0.45}" width="${s * 0.4}" height="${s * 0.45}" rx="${s * 0.1}"/></g>`
  const cells = Array.from({ length: total }, (_, i) => fig((i % per) * s, Math.floor(i / per) * s, i < count)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${count} in ${total}">${cells}${opts.label ? `<text x="0" y="${H - 6}" font-family="sans-serif" font-size="13" fill="#444">${opts.label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` : ''}</svg>`
}

export interface NumberIssue { id: string; rule: string; text: string; fix: string }
const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim())
/** PL-N01 to N05: number habits that mislead lay readers. */
export function numberChecks(text: string): NumberIssue[] {
  const out: NumberIssue[] = [], add = (rule: string, t: string, fix: string) => out.push({ id: `${rule}:${out.length}`, rule, text: t, fix })
  for (const s of sentencesOf(text)) {
    if (/\b\d+(\.\d+)?\s?%/.test(s) && !/\b\d+(?:,\d{3})?\s+(in|out of)\s+(every\s+)?\d/i.test(s)) add('PL-N01', s, 'Add a natural frequency: “12% (about 12 in 100 people)”.')
    if (/\b(reduc|lower|cut|halv|increas|rais|doubl)\w*[^.]{0,40}\b(risk|chance|rate)\b/i.test(s) && /\b\d+\s?%|\bhalf\b|\bhalved\b|\bdoubl/i.test(s) && !/\bfrom\s+(about\s+)?\d+[^.]{0,30}\bto\s+(about\s+)?\d+|\bin (100|1,?000|10,?000)\b/i.test(s)) add('PL-N02', s, 'A relative change on its own misleads: give the absolute numbers (“from 2 in 1,000 to 1 in 1,000”).')
    if (/\b\d+\s?%\s+(of|more|less|fewer)\s+(the\s+)?\d+\s?%|percentage points?/i.test(s)) add('PL-N03', s, 'A percentage of a percentage is hard to follow: give each group’s numbers.')
    if (/\bp\s*[<=>]\s*0?\.\d|\bp-?value|statistically significant/i.test(s)) add('PL-N05', s, 'Leave p-values and “statistically significant” out of lay text; say whether the difference is likely to be real in plain words.')
    const term = /\b(very common|common|uncommon|very rare|rare)\b/i.exec(s), num = /\b(\d+(?:\.\d+)?)\s?%|\b(\d+)\s+in\s+(100|1,?000|10,?000)\b/i.exec(s)
    if (term && num) {
      const raw = num[1] ? Number(num[1]) : (100 * Number(num[2])) / Number(num[3].replace(',', ''))
      // “up to 1 in 10” is the top of a band; “more than 1 in 10” is above it.
      const before = s.slice(Math.max(0, num.index - 12), num.index)
      const pct = /up to\s*$/i.test(before) ? raw * 0.99 : /more than\s*$/i.test(before) ? raw * 1.01 : raw
      const want = frequencyTerm(pct).term
      if (want !== term[1].toLowerCase()) add('PL-N04', s, `${num[0]} is “${want}” in the EU convention, not “${term[1].toLowerCase()}”.`)
    }
  }
  const denoms = new Set([...text.matchAll(/\b\d+\s+(?:in|out of)\s+(?:every\s+)?(\d[\d,]*)\b/gi)].map((m) => m[1].replace(',', '')))
  if (denoms.size > 1) add('PL-N03', `Denominators used: ${[...denoms].join(', ')}`, 'Use one denominator throughout (for example all “in 100”), so readers can compare.')
  return out
}
