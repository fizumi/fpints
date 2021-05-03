import { URIS, Kind } from './HKT'
import { Functor } from './Functor'
import { append } from './utils'
import Option, { Some, isSome, None } from './Option'
import { option as O, state as S } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import State, { get as getState, set as setState, VALUE } from './State'
import { Monad as StateMonad_, State as State_, get as get_, put as set_, of as unit_ } from 'fp-ts/State'
import { Do } from 'fp-ts-contrib/lib/Do'

// リスト 11-8
// this class use unit and flatMap as primitive combinators
export abstract class Monad<F extends URIS, E = never> extends Functor<F, E> {
  abstract unit<A>(a: A): Kind<F, A, E>
  abstract flatMap: <A>(ma: Kind<F, A, E>) => <B>(f: (a: A) => Kind<F, B, E>) => Kind<F, B, E>

  // EXERCISE 11.8
  flatMap_compose = <A>(ma: Kind<F, A, E>) => <B>(f: (a: A) => Kind<F, B, E>): Kind<F, B, E> =>
    this.compose((_: null) => ma, f)(null)

  // EXERCISE 11.13
  flatMap_join_map = <A>(ma: Kind<F, A, E>) => <B>(f: (a: A) => Kind<F, B, E>): Kind<F, B, E> =>
    this.join(this.map(ma)(f))

  map = <A>(ma: Kind<F, A, E>) => <B>(f: (a: A) => B): Kind<F, B, E> => this.flatMap(ma)((a: A) => this.unit(f(a)))
  map2 = <A, B>(ma: Kind<F, A, E>, mb: Kind<F, B, E>) => <C>(f: (a: A, b: B) => C): Kind<F, C, E> =>
    this.flatMap(ma)((a: A) => this.map(mb)((b: B) => f(a, b)))

  // EXERCISE 11.3
  sequence = <A>(lma: Kind<F, A, E>[]): Kind<F, A[], E> =>
    lma.reduce<Kind<F, A[], E>>((acc, ma) => this.map2(ma, acc)(append), this.unit([] as A[]))

  traverse = <A, B>(la: A[]) => (f: (a: A) => Kind<F, B, E>): Kind<F, B[], E> =>
    la.reduce<Kind<F, B[], E>>((acc, a) => this.map2(f(a), acc)(append), this.unit([] as B[]))

  // EXERCISE 11.4
  replicateM = <A>(n: number, ma: Kind<F, A, E>): Kind<F, A[], E> => this.sequence(new Array<Kind<F, A, E>>(n).fill(ma))

  // EXERCISE 11.7
  // Kleisli arrow（クライスリ射）
  compose = <A, B, C>(f: (a: A) => Kind<F, B, E>, g: (b: B) => Kind<F, C, E>) => (a: A): Kind<F, C, E> =>
    this.flatMap(f(a))(g)

  // EXERCISE 11.13
  compose_join_map = <A, B, C>(f: (a: A) => Kind<F, B, E>, g: (b: B) => Kind<F, C, E>) => (a: A): Kind<F, C, E> =>
    this.join(this.map(f(a))(g))

  join = <A>(mma: Kind<F, Kind<F, A, E>, E>): Kind<F, A, E> => this.flatMap(mma)((ma) => ma)

  product = <A, B>(ma: Kind<F, A, E>, mb: Kind<F, B, E>): Kind<F, [A, B], E> => this.map2(ma, mb)((x, y) => [x, y])

  // EXERCISE 11.6
  // filterM = <A>(ms: A[])(f: A => Kind<F, Boolean, E>): Kind<F, A[], E> =
}

// EXERCISE 11.1
export const arrayMonad = new (class extends Monad<'Array'> {
  unit = <A>(a: A): Array<A> => [a]
  flatMap = <A>(ma: Array<A>) => <B>(f: (a: A) => Array<B>): Array<B> =>
    ma.reduce<Array<B>>((acc, a) => [...acc, ...f(a)], [] as B[])
})()

export const arrayMonad_1 = new (class extends Monad<'Array'> {
  unit = <A>(a: A): Array<A> => [a]
  map = <A>(ma: Array<A>) => <B>(f: (a: A) => B): Array<B> => ma.reduce<Array<B>>((acc, a) => [...acc, f(a)], [] as B[])
  join = <A>(mma: A[][]): A[] => mma.reduce<A[]>((acc, a) => [...acc, ...a], [] as A[])
  flatMap = <A>(ma: Array<A>) => <B>(f: (a: A) => Array<B>): Array<B> => this.join(this.map(ma)(f))
})()

export const optionMonad = new (class extends Monad<'Option'> {
  unit = <A>(a: A): Option<A> => Some(a)
  flatMap = <A>(ma: Option<A>) => <B>(f: (a: A) => Option<B>): Option<B> => (isSome(ma) ? f(ma.value) : None)
})()

// 11.4 モナド則
// 結合律
const associativity = <F extends URIS, A, B, C, D>(
  m: Monad<F>,
  f: (a: A) => Kind<F, B>,
  g: (b: B) => Kind<F, C>,
  h: (c: C) => Kind<F, D>,
  compare: (ad1: (a: A) => Kind<F, D>, ad2: (a: A) => Kind<F, D>) => boolean
): boolean => {
  const { compose } = m
  const ad1 = compose(f, compose(g, h))
  const ad2 = compose(compose(f, g), h)
  return compare(ad1, ad2)
}
// 同一律
const identity = <F extends URIS, A, B>(
  m: Monad<F>,
  f: (a: A) => Kind<F, B>,
  compare: (ab1: (a: A) => Kind<F, B>, ab2: (a: A) => Kind<F, B>) => boolean
): boolean => {
  const { compose, unit } = m
  const ab1 = compose<A, B, B>(f, unit)
  const ab2 = compose<A, A, B>(unit, f)
  return compare(ab1, ab2) && compare(ab1, f)
}
// monoidLaws (モナド則)
export const isMonad = <F extends URIS, A, B, C, D>(
  m: Monad<F>,
  f: (a: A) => Kind<F, B>,
  g: (b: B) => Kind<F, C>,
  h: (c: C) => Kind<F, D>,
  compareAD: (ad1: (a: A) => Kind<F, D>, ad2: (a: A) => Kind<F, D>) => boolean,
  compareAB: (ab1: (a: A) => Kind<F, B>, ab2: (a: A) => Kind<F, B>) => boolean
): boolean => associativity(m, f, g, h, compareAD) && identity(m, f, compareAB)

// 11.5.1 単位元モナド
export type Id<A> = A
declare module './HKT' {
  interface URItoKind<A> {
    Id: Id<A>
  }
}
export const idMonad = new (class extends Monad<'Id'> {
  unit = <A>(a: A): Id<A> => a
  flatMap = <A>(ma: Id<A>) => <B>(f: (a: A) => Id<B>): Id<B> => f(ma)
})()

class StateMonad<S> extends Monad<'State', S> {
  flatMap = <A>(ma: State<S, A>) => <B>(f: (a: A) => State<S, B>): State<S, B> => ma.flatMap(f)
  unit = <A>(a: A): State<S, A> => new State((s: S) => [a, s])
}
const F = new StateMonad<number>()

// リスト 11-12
export const zipWithIndex = <A>(as: A[]): [number, A][] =>
  as
    .reduce<State<number, [number, A][]>>(
      (acc, a) =>
        acc.flatMap((xs) => getState<number>().flatMap((n) => setState<number>(n + 1).map((_) => [...xs, [n, a]]))),
      F.unit<[number, A][]>(new Array<[number, A]>())
    )
    .run(0)[VALUE]

// リスト 11-12 fp-ts version
export const zipWithIndex2 = <A>(as: A[]): [number, A][] =>
  S.evaluate(0)(
    as.reduce<State_<number, [number, A][]>>(
      (acc, a) =>
        Do(StateMonad_)
          .bind('xs', acc)
          .bind('n', get_())
          .doL(({ n }) => set_(n + 1))
          .return(({ xs, n }) => [...xs, [n, a]]),
      unit_(new Array<[number, A]>())
    )
  )

// リスト 11-12 fp-ts version 2
export const zipWithIndex3 = <A>(as: A[]): [number, A][] =>
  S.evaluate(0)(
    as.reduce<S.State<number, [number, A][]>>(
      (acc, a) =>
        pipe(
          acc,
          S.bindTo('xs'),
          S.bind('n', () => S.get<number>()),
          S.bind('_', ({ n }) => S.put(n + 1)),
          S.map(({ xs, n }) => [...xs, [n, a]])
        ),
      S.of(new Array<[number, A]>())
    )
  )

// c.f. map2 in fp-ts
// https://github.com/gcanti/fp-ts/issues/1236#issuecomment-641779152
export const optionMap2 = <A, B, R>(fa: O.Option<A>, fb: O.Option<B>, f: (a: A, b: B) => R): O.Option<R> =>
  O.Monad.chain(fa, (a: A) => O.Monad.map(fb, (b: B) => f(a, b)))
export const optionMap2_withPipe = <A, B, R>(fa: O.Option<A>, fb: O.Option<B>, f: (a: A, b: B) => R): O.Option<R> =>
  pipe(
    fa,
    O.chain((a) =>
      pipe(
        fb,
        O.map((b) => f(a, b))
      )
    )
  )
export const optionMap2_withBind = <A, B, R>(fa: O.Option<A>, fb: O.Option<B>, f: (a: A, b: B) => R): O.Option<R> =>
  pipe(
    O.bindTo('a')(fa),
    O.bind('b', () => fb),
    O.map(({ a, b }) => f(a, b))
  )
