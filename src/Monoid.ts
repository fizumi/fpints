/* eslint-disable @typescript-eslint/no-unused-vars */
import { URIS, Kind } from './HKT'
import Option, { Some, None, isSome } from './Option'
import { Tree, isLeaf } from './Tree'
import { curry2 } from './utils'

// リスト 10-1
export type Monoid<A> = {
  op: (a1: A, a2: A) => A
  zero: A
}

// リスト 10-2
export const stringMonoid: Monoid<string> = {
  op: (a1: string, a2: string): string => a1 + a2,
  zero: '',
}

// リスト 10-3
export const arrayMonoid = <A>(): Monoid<Array<A>> => ({
  op: (a1: A[], a2: A[]): A[] => [...a1, ...a2],
  zero: [] as A[],
})

// EXERCISE 10.1
export const numberAddition: Monoid<number> = {
  op: (x: number, y: number): number => x + y,
  zero: 0,
}

export const numberMultiplication: Monoid<number> = {
  op: (x: number, y: number): number => x * y,
  zero: 1,
}

export const booleanOr: Monoid<boolean> = {
  op: (x: boolean, y: boolean): boolean => x || y,
  zero: false,
}

export const booleanAnd: Monoid<boolean> = {
  op: (x: boolean, y: boolean): boolean => x && y,
  zero: true,
}

// EXERCISE 10.2
export const optionMonoid = <A>(): Monoid<Option<A>> => ({
  op: (x: Option<A>, y: Option<A>): Option<A> => x.orElse(y),
  zero: None,
})

export const objectMonoid = <K extends string | number | symbol, V>(): Monoid<Record<K, V>> => ({
  op: (x: Record<K, V>, y: Record<K, V>): Record<K, V> => ({ ...x, ...y }),
  zero: {} as Record<K, V>,
})

// EXERCISE 10.3
type Endofunction<A> = (a: A) => A
type E<A> = Endofunction<A>
export const endoMonoid = <A>(): Monoid<E<A>> => ({
  op: (f: E<A>, g: E<A>): E<A> => (a: A) => f(g(a)),
  zero: (a: A): A => a,
})

// This is true in general--that is, every monoid has a _dual_ where the
// `op` combines things in the opposite order. Monoids like `booleanOr` and
// `intAddition` are equivalent to their duals because their `op` is commutative(可換/交換法則を持つ)
// as well as associative.
export const dual = <A>(m: Monoid<A>): Monoid<A> => ({
  op: (x: A, y: A): A => m.op(y, x), // just flip the `op`.
  zero: m.zero,
})
// Now we can have both monoids on hand
const firstOptionMonoid = optionMonoid<number>()
const lastOptionMonoid = dual(firstOptionMonoid)

// EXERCISE 10.4
// 結合律
const associativity = <A>(m: Monoid<A>, x: A, y: A, z: A, compare: (a1: A, a2: A) => boolean): boolean => {
  const { op } = m
  const a1 = op(x, op(y, z))
  const a2 = op(op(x, y), z)
  return compare(a1, a2)
}
// 同一律
const identity = <A>(m: Monoid<A>, x: A, compare: (a1: A, a2: A) => boolean): boolean => {
  const { op, zero } = m
  const a1 = op(x, zero)
  const a2 = op(zero, x)
  return compare(a1, a2) && compare(a1, x)
}
// monoidLaws (モノイド則)
export const isMonoid = <A>(m: Monoid<A>, x: A, y: A, z: A, compare: (a1: A, a2: A) => boolean): boolean =>
  associativity(m, x, y, z, compare) && identity(m, x, compare)

// 10.2 モノイドによるリストの畳み込み
// (f: (a: A) => B) を使って A型の要素を全てB型に変換し、Monoid<B>を使ってB型の要素全てを結合する。
export const foldMap = <A, B>(as: A[], m: Monoid<B>) => (f: (a: A) => B): B =>
  as.reduce<B>((acc, a) => m.op(acc, f(a)), m.zero)

// foldLeft は initialValue と currentValue の型が同じの場合の reduce と言える。また、reduce と引数の順番が異なる。
export const foldLeft = <A>(as: Array<A>) => <B>(z: B) => (f: (b: B, a: A) => B): B =>
  foldMap(as, dual(endoMonoid<B>()))((a) => (b) => f(b, a))(z)
export const foldLeft_analysis = <A>(as: Array<A>) => <B>(z: B) => (f: (b: B, a: A) => B): B => {
  const em = dual(endoMonoid<B>()) // em.op <=> pipe(f,g)
  const curriedF = (a: A) => (b: B) => f(b, a)
  const piped = as.reduce<E<B>>((acc, a) => em.op(acc, curriedF(a)), em.zero)
  // Ramda.pipe ( em.zero, curryedF1, curryedF2, ... curryedFN [ Nth of curryedF(a)] )
  return piped(z)
}
export const foldRight = <A>(as: Array<A>) => <B>(z: B) => (f: (a: A, b: B) => B): B =>
  foldMap(as, endoMonoid<B>())(curry2(f))(z)
export const foldRight_analysis = <A>(as: Array<A>) => <B>(z: B) => (f: (a: A, b: B) => B): B => {
  const em = endoMonoid<B>() // em.op <=> compose(f,g)
  const curriedF = curry2(f)
  const composed = as.reduce<E<B>>((acc, a) => em.op(acc, curriedF(a)), em.zero)
  // Ramda.compose ( em.zero, curryedF1, curryedF2, ... curryedFN [ Nth of curryedF(a)] )
  return composed(z)
}

// 平衡畳み込み（balanced fold）
// foldMapV

// ordered

// par
// parFoldMap
// wcMonoid
// count

// リスト 10-4
export const concatenate = <A>(as: A[], m: Monoid<A>): A => as.reduce<A>((acc, a) => m.op(acc, a), m.zero)

// 10.6 モノイドの合成
// 型 A と型 B がモノイドである場合、タプル型 (A, B) もモノイドとなり、それらの積（product）と呼ばれます。
// EXERCISE 10.16
export const productMonoid = <A, B>(a: Monoid<A>, b: Monoid<B>): Monoid<[A, B]> => ({
  op: (x: [A, B], y: [A, B]): [A, B] => [a.op(x[0], y[0]), b.op(x[1], y[1])],
  zero: [a.zero, b.zero],
})

// EXERCISE 10.17
export const functionMonoid = <A, B>(b: Monoid<B>): Monoid<(a: A) => B> => ({
  op: (f: (a: A) => B, g: (a: A) => B): ((a: A) => B) => (a: A) => b.op(f(a), g(a)),
  zero: (_: A): B => b.zero,
})

// 10.6.1 より複雑なモノイドの構築
const mapMergeMonoid = <K, V>(v: Monoid<V>): Monoid<Map<K, V>> => ({
  op: (a: Map<K, V>, b: Map<K, V>): Map<K, V> =>
    [...Array.from(a.keys()), ...Array.from(b.keys())].reduce<Map<K, V>>(
      (acc, k) => acc.set(k, v.op(a.get(k) || v.zero, b.get(k) || v.zero)),
      new Map<K, V>()
    ),
  zero: new Map<K, V>(),
})

// EXERCISE 10.18
export const bag = <A>(as: A[]): Map<A, number> =>
  foldMap<A, Map<A, number>>(as, mapMergeMonoid(numberAddition))((a: A) => new Map([[a, 1]]))

// 10.6.2 合成されたモノイドを使った走査の融合
export const mean = (as: number[]): Option<number> => {
  const [sum, count] = foldMap(as, productMonoid(numberAddition, numberAddition))((a: number) => [a, 1])
  return count === 0 ? None : Some(sum / count)
}

// 畳み込み可能なデータ構造
export abstract class Foldable<F extends URIS> {
  abstract foldRight: <A>(as: Kind<F, A>) => <B>(z: B) => (f: (a: A, b: B) => B) => B

  // EXERCISE 10.6
  foldLeft = <A>(as: Kind<F, A>) => <B>(z: B) => (f: (b: B, a: A) => B): B =>
    this.foldMap(as)((a) => (b: B) => f(b, a))(dual(endoMonoid<B>()))(z)

  foldLeft_descriptive = <A>(as: Kind<F, A>) => <B>(z: B) => (f: (b: B, a: A) => B): B => {
    const snd: (a: A) => Endofunction<B> = (a: A) => (b: B) => f(b, a)
    const thd: Monoid<Endofunction<B>> = dual(endoMonoid<B>())
    const folded: Endofunction<B> = this.foldMap(as)(snd)(thd)
    return folded(z)
  }

  foldLeft_failure = <A>(as: Kind<F, A>) => <B>(z: B) => (f: (b: B, a: A) => B): B => {
    const rearrangeArgs = (f: (b: B, a: A) => B) => (a: A, b: B) => f(b, a)
    return this.foldRight(as)(z)(rearrangeArgs(f))
  }

  // EXERCISE 10.5
  foldMap = <A>(as: Kind<F, A>) => <B>(f: (a: A) => B) => (mb: Monoid<B>): B =>
    this.foldRight(as)(mb.zero)((a, b) => mb.op(f(a), b))

  concatenate = <A>(as: Kind<F, A>) => (m: Monoid<A>): A => this.foldLeft(as)(m.zero)(m.op)
  concatenateR = <A>(as: Kind<F, A>) => (m: Monoid<A>): A => this.foldRight(as)(m.zero)(m.op)
  concatenateM = <A>(as: Kind<F, A>) => (m: Monoid<A>): A => this.foldMap(as)((a) => a)(m)

  // EXERCISE 10.15
  toList = <A>(as: Kind<F, A>): Array<A> => this.foldRight(as)(new Array<A>())((a, b) => [a, ...b])

  toListViaMonoid = <A>(as: Kind<F, A>): Array<A> => this.foldMap(as)(Array.of)(arrayMonoid()) // extra
  // Kind<F, A> の unit(of) と monoid があれば、Foldable から Kind<F, A> に変換可能.
}

// EXERCISE 10.13
export class TreeFoldable extends Foldable<'Tree'> {
  foldRight = <A>(as: Tree<A>) => <B>(z: B) => (f: (a: A, b: B) => B): B => {
    if (isLeaf(as)) return f(as.value, z)
    return this.foldRight(as.left)(this.foldRight(as.right)(z)(f))(f)
  }
}

// EXERCISE 10.14
export class OptionFoldable extends Foldable<'Option'> {
  foldRight = <A>(as: Option<A>) => <B>(z: B) => (f: (a: A, b: B) => B): B => {
    if (isSome(as)) return f(as.value, z)
    return z
  }
}

export const toSet = <F extends URIS, A>(foldable: Foldable<F>, as: Kind<F, A>): Set<A> =>
  foldable.foldRight(as)(new Set<A>())((a, b) => b.add(a))
