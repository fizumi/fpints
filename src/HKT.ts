// TypeScript doesn't support higher kinded types (HKT,高階型コンストラクタ,高類型)
// c.f. https://github.com/Microsoft/TypeScript/issues/1213

// How to fake HKT with an interface
// https://gist.github.com/gcanti/2b455c5008c2e1674ab3e8d5790cdad5#file-fp-ts-technical-overview-md
// https://github.com/gcanti/fp-ts/blob/master/src/HKT.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import Option from './Option'
import { Tree } from './Tree'
import State from './State'

// ↓ 「URI」("Array", "Option") と その URI に紐づく 「型コンストラクタと型Aで作成した型」（Array<A>, Option<A>） を URItoKind に “登録” する.
export interface URItoKind<A, E = never> {
  Array: Array<A>
  Option: Option<A>
  Tree: Tree<A>
  State: State<E, A>
}
// ※ tp-ts のように Monad"2" を作るのが面倒だったので, 横着して
// 試しに optional type parameter を用いている.

/*
下記のようにして HKT.ts 以外のファイルで登録することも可能
export type Id<A> = A
declare module './HKT' {
  interface URItoKind<A> {
    Id: Id<A>
  }
}
*/

export type URIS = keyof URItoKind<any>

// ↓ Kind に URI と 型A を与えることで, その URI に紐づく型コンストラクタ に 型A を渡すことで得られる型 を得る
export type Kind<URI extends URIS, A, E = never> = URI extends URIS ? URItoKind<A, E>[URI] : never
