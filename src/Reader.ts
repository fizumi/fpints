import { pipe } from 'fp-ts/function'
import { ask, chain, Reader } from 'fp-ts/Reader'
/**
 * dev.to の 記事より
 *
 * title: Getting started with fp-ts: Reader
 * url: https://dev.to/gcanti/getting-started-with-fp-ts-reader-1ie5
 */

// 1.
// 以下のような関数があるとする。
// h は g に、g は f に依存している。
const f__ = (b: boolean): string => (b ? 'true' : 'false')
const g__ = (n: number): string => f__(n > 2)
export const h__ = (s: string): string => g__(s.length + 1)
console.log(h__('foo')) // 'true'

// 2.
// What if we want to internationalise f?
// h を実行した時に出力する文字列について、i18nする。
interface Dependencies_ {
  i18n: {
    true: string
    false: string
  }
}
const f_ = (b: boolean, deps: Dependencies_): string => (b ? deps.i18n.true : deps.i18n.false)
const g_ = (n: number, deps: Dependencies_): string => f_(n > 2, deps)
export const h_ = (s: string, deps: Dependencies_): string => g_(s.length + 1, deps)
export const instance_: Dependencies_ = {
  i18n: {
    true: '真',
    false: '偽',
  },
}
// console.log(h_('foo', instance_)) // '真'
// h and g must have knowledge about f dependencies despite not using them.
// f が dependencies を必要としているので, h, g にも本来不要な dependencies を渡す必要が生じる.
// (React における props drilling 問題に似ている)

// 3.
// 上記を monadic interface を使って記載する場合は、下記のようになる。
// (なお下記では、関数間で持ちまわる情報（ここでは, Dependencies）に新しい情報を付け加え、それを g 内で参照するという機能を加えている。)
interface Dependencies {
  i18n: {
    true: string
    false: string
  }
  lowerBound: number
}

export const instance: Dependencies = {
  i18n: {
    true: 'vero',
    false: 'falso',
  },
  lowerBound: 2,
}
// const f = (b: boolean): ((deps: Dependencies) => string) => deps => (b ? deps.i18n.true : deps.i18n.false) ↓
const f = (b: boolean): Reader<Dependencies, string> => (deps) => (b ? deps.i18n.true : deps.i18n.false)
const g = (n: number): Reader<Dependencies, string> =>
  pipe(
    ask<Dependencies>(),
    chain((deps) => f(n > deps.lowerBound))
  )
export const h = (s: string): Reader<Dependencies, string> => g(s.length + 1)
// console.log(h('foo')(instance)) // 'vero'
// console.log(h('foo')({ ...instance, lowerBound: 4 })) // 'falso'
// Readerを使用することで、関数間で持ちまわる情報から自由に情報を取り出し、使用することができる。

// 注: 記事のコメント欄を見た方が真価が分かりやすい. TODO コメント欄まとめ
