/* eslint-disable @typescript-eslint/no-unused-vars */
import { Functor } from './Functor'
import { Kind, URIS } from './HKT'
import { append, curry2, curry3 } from './utils'

// fp-ts
import { HKT } from 'fp-ts/HKT'
import { Apply, sequenceT } from 'fp-ts/Apply'
import { sequence } from 'fp-ts/Array'
import { Either, getApplicativeValidation, left, map, mapLeft, right } from 'fp-ts/Either'
import { constant, pipe } from 'fp-ts/function'
import { traversable as TR, identity as Id, option as O, nonEmptyArray as NEA } from 'fp-ts'

// リスト 12-1
export default abstract class Applicative<F extends URIS> extends Functor<F> {
  // プリミティブコンビネータ
  abstract unit<A>(a: A): Kind<F, A> // of
  abstract map2<A, B>(fa: Kind<F, A>, fb: Kind<F, B>): <C>(f: (a: A, b: B) => C) => Kind<F, C>

  // 派生コンビネータ
  map = <A>(fa: Kind<F, A>) => <B>(f: (a: A) => B): Kind<F, B> => this.map2(fa, this.unit(undefined))(f)
  traverse = <A>(as: A[]) => <B>(f: (a: A) => Kind<F, B>): Kind<F, B[]> =>
    as.reduce<Kind<F, B[]>>((acc, a) => this.map2(f(a), acc)(append), this.unit([] as B[]))

  // EXERCISE 12.1
  sequence = <A>(fas: Kind<F, A>[]): Kind<F, A[]> => this.traverse(fas)((fa) => fa)
  // replicateM
  product = <A, B>(fa: Kind<F, A>, fb: Kind<F, B>): Kind<F, [A, B]> => this.map2(fa, fb)((x, y) => [x, y])

  // EXERCISE 12.2
  apply = <A, B>(fab: Kind<F, (a: A) => B>) => (fa: Kind<F, A>): Kind<F, B> => this.map2(fab, fa)((x, y) => x(y))

  factor = <A, B>(fa: Kind<F, A>, fb: Kind<F, B>): Kind<F, [A, B]> => this.map2(fa, fb)((x, y) => [x, y])

  // compose[G[_]](G: Applicative[G]): Applicative[({type f[x] = F[G[x]]})#f]

  // sequenceMap[K,V](ofa: Map[K,F[V]]): F[Map[K,V]]
}

// EXERCISE 12.2
export abstract class Applicative2<F extends URIS> extends Functor<F> {
  // プリミティブコンビネータ
  abstract apply<A, B>(fab: Kind<F, (a: A) => B>): (fa: Kind<F, A>) => Kind<F, B>
  abstract unit<A>(a: A): Kind<F, A>

  // 派生コンビネータ
  map = <A>(fa: Kind<F, A>) => <B>(f: (a: A) => B): Kind<F, B> => this.apply(this.unit(f))(fa)
  map2 = <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => <C>(f: (a: A, b: B) => C): Kind<F, C> =>
    this.apply(this.apply(this.unit(curry2(f)))(fa))(fb)

  // EXERCISE 12.3
  map3 = <A, B, C>(fa: Kind<F, A>, fb: Kind<F, B>, fc: Kind<F, C>) => <D>(f: (a: A, b: B, c: C) => D): Kind<F, D> =>
    this.apply(this.apply(this.apply(this.unit(curry3(f)))(fa))(fb))(fc)
}

// 12.5.1 左単位元（Left identity）と右単位元（Right identity）
const identity = <F extends URIS, A>(
  ap: Applicative<F>,
  fa: Kind<F, A>,
  compare: (fa1: Kind<F, A>, fa2: Kind<F, A>) => boolean
): boolean => {
  const { map2, unit } = ap
  const fa1 = map2(fa, unit(null))((a: A, _) => a)
  const fa2 = map2(unit(null), fa)((_, a: A) => a)
  return compare(fa1, fa2)
}

// 12.5 アプリカティブの法則
// 12.5.2 結合性
const associativity = <F extends URIS, A, B, C>(
  ap: Applicative<F>,
  fa: Kind<F, A>,
  fb: Kind<F, B>,
  fc: Kind<F, C>,
  compare: (fa1: Kind<F, [[A, B], C], never>, fa2: Kind<F, [[A, B], C], never>) => boolean
): boolean => {
  const { product, map } = ap
  const assoc = <A, B, C>(p: [A, [B, C]]): [[A, B], C] => [[p[0], p[1][0]], p[1][1]]
  const ad1 = product(product(fa, fb), fc)
  const ad2 = map(product(fa, product(fb, fc)))(assoc)
  return compare(ad1, ad2)
}

// 12.5.3 積の自然性
const naturality = <F extends URIS, A, B, O, O2>(
  ap: Applicative<F>,
  fa: Kind<F, A>,
  fb: Kind<F, B>,
  f: (a: A) => O,
  g: (b: B) => O2,
  compare: (fa1: Kind<F, [O, O2], never>, fa2: Kind<F, [O, O2], never>) => boolean
): boolean => {
  const { product, map, map2 } = ap
  const productF = <I, O, I2, O2>(f: (i: I) => O, g: (i2: I2) => O2) => (i: I, i2: I2): [O, O2] => [f(i), g(i2)]
  const ad1 = map2(fa, fb)(productF(f, g))
  const ad2 = product(map(fa)(f), map(fb)(g))
  return compare(ad1, ad2)
}

export abstract class Traverse<F extends URIS, M extends URIS> {
  abstract map<A>(fa: Kind<F, A>): <B>(f: (a: A) => B) => Kind<F, B>

  traverse = <A>(fa: Kind<F, A>) => <B>(f: (a: A) => Kind<M, B>): Kind<M, Kind<F, B>> => this.sequence(this.map(fa)(f))

  sequence = <A>(fma: Kind<F, Kind<M, A>>): Kind<M, Kind<F, A>> => this.traverse(fma)((ma) => ma)
}

/*
 *
    以下、 fp-ts を 参照・利用する。
 */
// EXERCISE 12.9
// https://github.com/gcanti/fp-ts/blob/master/src/Applicative.ts
// getApplicativeComposition

// EXERCISE 12.12
// https://github.com/gcanti/fp-ts/blob/master/src/ReadonlyMap.ts
// https://github.com/gcanti/fp-ts/blob/master/src/ReadonlyRecord.ts
// sequence

// Traverse
// https://github.com/gcanti/fp-ts/blob/master/src/Traversable.ts

// EXERCISE 12.13
// List: https://github.com/gcanti/fp-ts/blob/master/src/Array.ts
// Option: https://github.com/gcanti/fp-ts/blob/master/src/Option.ts
// Tree: https://github.com/gcanti/fp-ts/blob/master/src/Tree.ts
// Traversable

// トラバーサブルは、
// 何らかのデータ構造を受け取り、そのデータ構造に含まれているデータに関数を順番に適用して
// 「元の構造を維持した」結果を生成する。
// 例えば、たとえば Tree[Option[A]] => Option[Tree[A]] では、Tree 構造を維持している。

// EXERCISE 12.14
export abstract class Traverse_fpts<T> {
  abstract traverse: TR.Traverse<T>

  map = <A, B>(fa: HKT<T, A>, f: (a: A) => B): HKT<T, B> => this.traverse(Id.Monad)(fa, f)
}

// リスト 12-10 Monoid から Applicative への変換
// https://github.com/gcanti/fp-ts/blob/master/src/Const.ts
// getApplicative

// EXERCISE 12.19
// https://github.com/gcanti/fp-ts/blob/master/src/Traversable.ts
// getTraversableComposition

/*
 *
    以下、fpinscala とは関係ない
 */

/**
 * dev.to の 記事より
 *
 * 検証：エラーを蓄積する Either
 * title: Getting started with fp-ts: Either vs Validation
 * url: https://dev.to/gcanti/getting-started-with-fp-ts-either-vs-validation-5eja
 */
const minLength = (s: string): Either<string, string> => (s.length >= 6 ? right(s) : left('at least 6 characters'))

const oneCapital = (s: string): Either<string, string> =>
  /[A-Z]/g.test(s) ? right(s) : left('at least one capital letter')

const oneNumber = (s: string): Either<string, string> => (/[0-9]/g.test(s) ? right(s) : left('at least one number'))

const lift = <E, A>(check: (a: A) => Either<E, A>): ((a: A) => Either<NEA.NonEmptyArray<E>, A>) => {
  return (a) =>
    pipe(
      check(a),
      mapLeft((a) => [a])
    )
}

const checks = [minLength, oneCapital, oneNumber]
const checksV = checks.map(lift)
const [minLengthV, oneCapitalV, oneNumberV] = checksV

// getValidation is supposed to be removed in v3
export const validatePassword_original = (s: string): Either<NEA.NonEmptyArray<string>, string> =>
  pipe(
    sequenceT(getApplicativeValidation(NEA.getSemigroup<string>()))(minLengthV(s), oneCapitalV(s), oneNumberV(s)),
    map(() => s) // Either<NonEmptyArray<string>, string"[]""> -> Either<NonEmptyArray<string>, string>
  )

const applyEach = <A, B>(fs: ((a: A) => B)[]): ((a: A) => B[]) => {
  return (a) => fs.map((f) => f(a)) // idea: https://github.com/ramda/ramda/wiki/Cookbook#applyeach
}

export const validatePassword = (s: string): Either<NEA.NonEmptyArray<string>, string> =>
  pipe(s, applyEach(checksV), sequence(getApplicativeValidation(NEA.getSemigroup<string>())), map(constant(s)))

// https://github.com/gcanti/fp-ts/issues/315#issuecomment-366016217
function map2<F>(instance: Apply<F>): <A, B, R>(fa: HKT<F, A>, fb: HKT<F, B>, f: (a: A, b: B) => R) => HKT<F, R> {
  return <A, B, R>(fa: HKT<F, A>, fb: HKT<F, B>, f: (a: A, b: B) => R) =>
    instance.ap(
      instance.map(fa, (a) => (b: B) => f(a, b)),
      fb
    )
}
// export const optionMap2_ = map2(O.Applicative) // 型エラーが生じる
export const optionMap2 = <A, B, R>(fa: O.Option<A>, fb: O.Option<B>, f: (a: A, b: B) => R): O.Option<R> =>
  O.Applicative.ap(
    O.Applicative.map(fa, (a) => (b: B) => f(a, b)),
    fb
  )
// https://rlee.dev/writing/practical-guide-to-fp-ts-part-5
export const optionMap2_ap = <A, B, R>(fa: O.Option<A>, fb: O.Option<B>, f: (a: A, b: B) => R): O.Option<R> =>
  pipe(O.of(curry2(f)), O.ap(fa), O.ap(fb))
