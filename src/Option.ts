import { append } from './utils'
import { sum } from 'ramda'
import { Monad, Option as Opt } from 'fp-ts/Option'
import { Do } from 'fp-ts-contrib/lib/Do'

// リスト 4-4
export default abstract class Option<T> {
  abstract flatten<U>(this: Option<Option<U>>): Option<U> // join
  abstract map: <U>(f: (value: T) => U) => Option<U>
  abstract flatMap: <U>(f: (value: T) => Option<U>) => Option<U> // chain
  abstract getOrElse: (defaultValue: T) => T // orDefault
  abstract getOrElseLazy: (thunk: () => T) => T // orDefaultLazy
  abstract orElse: (other: Option<T>) => Option<T> // alt
  abstract orElseLazy: (thunk: () => Option<T>) => Option<T>
  abstract filter: (f: (value: T) => boolean) => Option<T>
  static of = <U>(value: U): Some<U> => some(value) // unit
  static zero = (): None => none // empty
}

// EXERCISE 4.1
class Some<T> extends Option<T> {
  constructor(private _value: T) {
    super()
  }

  get value(): T {
    return this._value
  }

  flatten<U>(this: Some<Option<U>>): Option<U> {
    return this._value
  }

  map = <U>(f: (value: T) => U): Option<U> => some(f(this._value))
  flatMap = <U>(f: (value: T) => Option<U>): Option<U> => f(this._value)
  getOrElse = (_: T): T => this._value
  getOrElseLazy = (_: () => T): T => this._value
  orElse = (_: Option<T>): Option<T> => this
  orElseLazy = (_: () => Option<T>): Option<T> => this
  filter = (f: (value: T) => boolean): Option<T> => (f(this._value) ? this : new None())
}

class None extends Option<never> {
  flatten<U>(this: Some<Option<U>>): None {
    return none
  }

  map = <U>(_: (value: never) => U): None => none
  flatMap = <U>(_: (value: never) => Option<U>): None => none
  getOrElse = <U>(defaultValue: U): U => defaultValue
  getOrElseLazy = <U>(thunk: () => U): U => thunk()
  orElse = <U>(other: Option<U>): Option<U> => other
  orElseLazy = <U>(thunk: () => Option<U>): Option<U> => thunk()
  filter = (_: (value: never) => boolean): None => none
}

export const fromNullable = <T>(value: T | undefined | null | void): Option<T> => (value == null ? none : some(value))
export const fromFalsy = <T>(
  value: T | undefined | null | void | 0 | -0 | '' | false /* 'NaN' type doesn't exist */
): Option<T> => (value ? some(value) : none)
export const fromPredicate = <T>(pred: (value: T) => boolean, value: T): Option<T> => (pred(value) ? some(value) : none)

// 4.3.2 Option の合成、リフト、例外指向の API のラッピング
// Option をひとたび使い始めれば、コードベース全体への影響は避けられない、というわけではない。
// 既存の関数をリフトすれば、単一の Option 値のコンテキスト内で動作する関数に変換できる。
export const lift = <T, U>(f: (value: T) => U) => (value: Option<T>): Option<U> => value.map(f)

// encase
export const tryLazy = <T>(thunk: () => T): Option<T> => {
  try {
    return some(thunk())
  } catch {
    return none
  }
}

// EXERCISE 4.3
export const map2 = <A, B, T>(a: Option<A>, b: Option<B>, f: (a: A, b: B) => T): Option<T> =>
  a.flatMap((aa) => b.map((bb) => f(aa, bb)))

// for-comprehension (for 内包表記) / Approximating haskell's do syntax in Typescript
export const map2_do = <A, B, T>(a: Opt<A>, b: Opt<B>, f: (a: A, b: B) => T): Opt<T> =>
  Do(Monad)
    .bind('aa', a)
    .bind('bb', b)
    .return(({ aa, bb }) => f(aa, bb))

// EXERCISE 4.4
export const sequence = <T>(os: Option<T>[]): Option<T[]> =>
  os.reduce<Option<T[]>>((acc, o) => map2(o, acc, append), some([] as T[]))

// recursive version
export const sequence_1 = <T>(os: Option<T>[]): Option<T[]> => {
  if (os.length === 0) return some([] as T[])
  const [h, ...t] = os
  return h.flatMap((hh) => sequence(t).map((tt) => [hh, ...tt]))
}
// dirived from traverse
export const sequence_2 = <T>(os: Option<T>[]): Option<T[]> => traverse((o) => o, os)

// EXERCISE 4.5
export const traverse = <T, A>(f: (a: A) => Option<T>, as: A[]): Option<T[]> =>
  as.reduce<Option<T[]>>((acc, a) => map2(f(a), acc, append), some([] as T[]))

export const unit = <T>(value: T): Some<T> => new Some(value)
export const compose = <A, B, C>(f: (a: A) => Option<B>, g: (b: B) => Option<C>) => (a: A): Option<C> => f(a).flatMap(g)

const some = <T>(value: T): Some<T> => new Some(value)
const none = new None()
export { some as Some, none as None }

// リスト 4-4
export const mean = (xs: number[]): Option<number> => (xs.length === 0 ? none : some(sum(xs) / xs.length))

// EXERCISE 4.2
export const squaredDeviation = (mean: number) => (x: number): number => (x - mean) ** 2
export const variance = (xs: number[]): Option<number> => mean(xs).flatMap((m) => mean(xs.map(squaredDeviation(m))))
//                                                     => mean(xs).map((m) => xs.map(squaredDeviation(m))).flatMap(mean)

export const isNone = <T>(op: Option<T>): op is None => op === none
export const isSome = <T>(op: Option<T>): op is Some<T> => op !== none
export const isSomeArray = <T>(os: Option<T>[]): os is Some<T>[] => os.every(isSome)
export const mapN = <T>(f: (...args: unknown[]) => T, ...os: Option<unknown>[]): Option<T> =>
  isSomeArray(os) ? sequence(os).map((args) => f(...args)) : none
