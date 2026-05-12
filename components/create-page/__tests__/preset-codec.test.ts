import { describe, it, expect } from 'vitest'
import {
  decodePreset,
  encodePreset,
  ourAccentToShadcn,
  ourFontToShadcn,
  ourHeadingFontToShadcn,
  ourPaletteToShadcn,
  ourRadiusToShadcn,
  ourStyleToShadcn,
  shadcnAccentToOur,
  shadcnFontToOur,
  shadcnHeadingFontToOur,
  shadcnPaletteToOur,
  shadcnRadiusToOur,
  shadcnStyleToOur,
} from '../preset-codec'

const ALL_DEFAULTS = {
  baseColor: 'neutral',
  theme: 'neutral',
  font: 'inter',
  radius: 'default',
  style: 'nova',
  fontHeading: 'inherit',
} as const

describe('preset codec', () => {
  it('encodes all-default state to the canonical "b0"', () => {
    expect(encodePreset(ALL_DEFAULTS)).toBe('b0')
  })

  it('decodes "b0" to all-default values', () => {
    expect(decodePreset('b0')).toEqual(ALL_DEFAULTS)
  })

  it('round-trips non-trivial picks', () => {
    const state = {
      baseColor: 'zinc' as const,
      theme: 'emerald' as const,
      font: 'geist' as const,
      radius: 'large' as const,
      style: 'mira' as const,
      fontHeading: 'playfair-display' as const,
    }
    const code = encodePreset(state)
    expect(code.startsWith('b')).toBe(true)
    expect(decodePreset(code)).toEqual(state)
  })

  it('starts with the "b" version marker for v2 codes', () => {
    const code = encodePreset({
      ...ALL_DEFAULTS,
      baseColor: 'taupe',
      theme: 'fuchsia',
      font: 'instrument-sans',
      radius: 'medium',
    })
    expect(code[0]).toBe('b')
  })

  it('returns null for malformed or empty input', () => {
    expect(decodePreset('')).toBeNull()
    expect(decodePreset(null)).toBeNull()
    expect(decodePreset(undefined)).toBeNull()
    expect(decodePreset('c123')).toBeNull() // unknown version
  })

  it('mirrors chartColor onto theme so generated codes match /create defaults', () => {
    const code = encodePreset({
      ...ALL_DEFAULTS,
      theme: 'blue',
    })
    const decoded = decodePreset(code)
    expect(decoded?.theme).toBe('blue')
  })
})

describe('local ↔ shadcn id mapping', () => {
  it('palette: our IDs pass through, "gray" folds to neutral', () => {
    expect(ourPaletteToShadcn('zinc')).toBe('zinc')
    expect(ourPaletteToShadcn('unknown')).toBe('neutral')
    expect(shadcnPaletteToOur('gray')).toBe('neutral')
    expect(shadcnPaletteToOur('mauve')).toBe('mauve')
  })

  it('accent: "default" ↔ neutral-family themes', () => {
    expect(ourAccentToShadcn('default')).toBe('neutral')
    expect(ourAccentToShadcn('blue')).toBe('blue')
    expect(shadcnAccentToOur('neutral')).toBe('default')
    expect(shadcnAccentToOur('gray')).toBe('default')
    expect(shadcnAccentToOur('mist')).toBe('default')
    expect(shadcnAccentToOur('emerald')).toBe('emerald')
  })

  it('font: synthetic "default" maps to inter; reverse never produces "default"', () => {
    expect(ourFontToShadcn('default')).toBe('inter')
    expect(ourFontToShadcn('geist')).toBe('geist')
    expect(shadcnFontToOur('inter')).toBe('inter') // no "default" round-trip
    expect(shadcnFontToOur('roboto')).toBe('roboto')
  })

  it('radius: short labels ↔ shadcn labels', () => {
    expect(ourRadiusToShadcn('sm')).toBe('small')
    expect(ourRadiusToShadcn('lg')).toBe('large')
    expect(ourRadiusToShadcn('default')).toBe('default')
    expect(shadcnRadiusToOur('small')).toBe('sm')
    expect(shadcnRadiusToOur('large')).toBe('lg')
  })

  it('style: shared enum, unknown falls back to nova', () => {
    expect(ourStyleToShadcn('nova')).toBe('nova')
    expect(ourStyleToShadcn('mira')).toBe('mira')
    expect(ourStyleToShadcn('garbage')).toBe('nova')
    expect(shadcnStyleToOur('luma')).toBe('luma')
    expect(shadcnStyleToOur('garbage')).toBe('nova')
  })

  it('heading font: "default" ↔ "inherit"', () => {
    expect(ourHeadingFontToShadcn('default')).toBe('inherit')
    expect(ourHeadingFontToShadcn('geist')).toBe('geist')
    expect(ourHeadingFontToShadcn('garbage')).toBe('inherit')
    expect(shadcnHeadingFontToOur('inherit')).toBe('default')
    expect(shadcnHeadingFontToOur('lora')).toBe('lora')
    expect(shadcnHeadingFontToOur('garbage')).toBe('default')
  })
})
