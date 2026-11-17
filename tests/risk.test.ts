import { expect, test } from 'vitest'
import { riskNumbers, naturalFrequency, frequencyTerm, numberChecks, iconArray } from '../src/domain/risk'

test('risk numbers', () => {
  const r = riskNumbers({ control: 2, treated: 1, denom: 1000 })
  expect(r.relative).toBe('cuts the risk by 50%'); expect(r.nnt).toBe(1000); expect(r.difference).toBe('1 fewer person in every 1,000')
  expect(riskNumbers({ control: 12, treated: 20, denom: 100 }).harm).toBe(true)
})
test('natural frequencies and EU terms', () => {
  expect(naturalFrequency(12)).toBe('about 12 in 100 people'); expect(naturalFrequency(0.3)).toBe('about 3 in 1,000 people')
  expect(frequencyTerm(12).term).toBe('very common'); expect(frequencyTerm(3).term).toBe('common'); expect(frequencyTerm(0.5).term).toBe('uncommon')
})
test('number checks', () => {
  const ids = (t: string) => numberChecks(t).map((i) => i.rule)
  expect(ids('The medicine halved the risk of a flare.')).toContain('PL-N02')
  expect(ids('The risk fell from about 2 in 1,000 to 1 in 1,000.')).not.toContain('PL-N02')
  expect(ids('Headache was common (12%).')).toEqual(expect.arrayContaining(['PL-N01', 'PL-N04']))
  expect(ids('The result was statistically significant (p<0.001).')).toContain('PL-N05')
  expect(ids('About 12 in 100 had a cold and 3 in 1,000 had a rash.')).toContain('PL-N03')
  expect(ids('About 12 in 100 people had a cold (very common).')).toEqual([])
  expect(iconArray(12)).toMatch(/aria-label="12 in 100"/)
})
