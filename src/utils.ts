import R from 'ramda'

// restrict types
type Append = <T>(el: T, list: readonly T[]) => T[]
export const append = R.append as Append

export const curry2 = <A, B, C>(f: (a: A, b: B) => C) => (a: A) => (b: B): C => f(a, b)
export const curry3 = <A, B, C, D>(f: (a: A, b: B, c: C) => D) => (a: A) => (b: B) => (c: C): D => f(a, b, c)
export const curry4 = <A, B, C, D, E>(f: (a: A, b: B, c: C, d: D) => E) => (a: A) => (b: B) => (c: C) => (d: D): E =>
  f(a, b, c, d)
