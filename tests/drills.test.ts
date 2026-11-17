import { describe, expect, test } from 'vitest'
import { PASSAGES, scoreRewrite } from '../src/domain/drills'
import { analyze } from '../src/domain/analyze'

describe('rewrite drills', () => {
  test('every model answer scores well and the source scores badly', () => {
    for (const p of PASSAGES) {
      const m = scoreRewrite(p, p.model), s = scoreRewrite(p, p.source)
      expect(m.kept.filter((k) => !k.ok).map((k) => `${p.id}: ${k.label}`)).toEqual([])
      expect(m.forbidden).toEqual([])
      expect(m.score, `${p.id} model ${JSON.stringify(m.lines)}`).toBeGreaterThanOrEqual(85)
      expect(s.score, `${p.id} source`).toBeLessThan(60)
      expect(analyze(p.source).grade).toBeGreaterThan(p.target)
    }
  })
  test('a short rewrite that drops the facts is capped', () => {
    const p = PASSAGES[0]
    expect(scoreRewrite(p, 'You get a tablet. It is safe. Come to the visits.').score).toBeLessThanOrEqual(40)
  })
})

test('a term explained in the same sentence counts as explained', () => {
  const p = PASSAGES[0]
  const s = scoreRewrite(p, 'You will be put into one of three groups by chance, with a 1 in 3 chance of each. One group gets a placebo with no medicine in it. You take a tablet once a day for 16 weeks. Nobody will know your group.')
  expect(s.lines[1].note ?? '').not.toMatch(/placebo/)
})
