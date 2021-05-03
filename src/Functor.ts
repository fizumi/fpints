import { URIS, Kind } from './HKT'

// リスト 11-1
export abstract class Functor<F extends URIS, E = never> {
  abstract map: <A>(fa: Kind<F, A, E>) => <B>(f: (a: A) => B) => Kind<F, B, E>

  // リスト 11-3
  distribute = <A, B>(fab: Kind<F, [A, B], E>): [Kind<F, A, E>, Kind<F, B, E>] => [
    this.map(fab)((x) => x[0]),
    this.map(fab)((x) => x[1]),
  ] // unzip of Array

  // codistribute<A,B>(e: Either<Kind<F,A>, Kind<F,B>>): Kind<F,Either<A, B>>
}

// リスト 11-2
export class ListFunctor extends Functor<'Array'> {
  map = <A>(fa: Array<A>) => <B>(f: (a: A) => B): Array<B> => fa.map(f)
}

// 恒等関数の保存 (preserve identity)
const identity = <F extends URIS, A>(
  functor: Functor<F>,
  fa: Kind<F, A>,
  compare: (fa1: Kind<F, A>, fa2: Kind<F, A>) => boolean
): boolean => {
  return compare(
    fa,
    functor.map(fa)((x) => x)
  )
}

// 合成の保存 (preserve composition)
const composition = <F extends URIS, A, B, C>(
  functor: Functor<F>,
  fa: Kind<F, A>,
  f: (a: A) => B,
  g: (b: B) => C,
  compare: (fc1: Kind<F, C>, fc2: Kind<F, C>) => boolean
): boolean => {
  const fb = functor.map(fa)(f)
  const fc = functor.map(fb)(g)
  const composedfg = (a: A) => g(f(a))
  return compare(fc, functor.map(fa)(composedfg))
}

// Functor Law (ファンクタ則)
export const isFunctor = <F extends URIS, A, B, C>(
  functor: Functor<F>,
  fa: Kind<F, A>,
  f: (a: A) => B,
  g: (b: B) => C,
  compare1: (fa1: Kind<F, A>, fa2: Kind<F, A>) => boolean,
  compare2: (fc1: Kind<F, C>, fc2: Kind<F, C>) => boolean
): boolean => identity(functor, fa, compare1) && composition(functor, fa, f, g, compare2)
