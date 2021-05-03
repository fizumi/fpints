import { log } from 'fp-ts/Console'
import { pipe } from 'fp-ts/function'
import { getApplicativeMonoid } from 'fp-ts/Applicative'
import { IO, MonadIO, Applicative } from 'fp-ts/IO'
import { concatAll, Monoid } from 'fp-ts/Monoid'
import { MonoidSum } from 'fp-ts/number'
import { getOrElse, isSome, map, none, Option, some } from 'fp-ts/Option'
import { randomInt } from 'fp-ts/Random'
import { toError } from 'fp-ts/Either'
import { IOEither, tryCatch, Monad as IOEMonad, rightIO } from 'fp-ts/IOEither'
import * as fs from 'fs'
import path from 'path'
/* eslint-disable @typescript-eslint/no-unused-vars */

// 13.1 作用のリファクタリング
class Player {
  constructor(public name: string, public score: number) {}
}

// before
const contest = (p1: Player, p2: Player): void => {
  if (p1.score > p2.score) console.log(`${p1.name} is the winner!`)
  else if (p2.score > p1.score) console.log(`${p2.name} is the winner!`)
  else console.log(`It's a draw.`)
}

// after
// 勝者または引き分けであることを割り出すロジックと勝者をコンソールに書き出すロジックの分離
const winner = (p1: Player, p2: Player): Option<Player> => {
  if (p1.score > p2.score) return some(p1)
  else if (p2.score > p1.score) return some(p2)
  else return none
}
const contest1 = (p1: Player, p2: Player): void => {
  const w = winner(p1, p2)
  isSome(w) ? console.log(`${w.value.name} is the winner!`) : console.log(`It's a draw.`)
}

// after2
// メッセージ内容定義と出力方法の分離
const winnerMsg = (p: Option<Player>): string =>
  pipe(
    p,
    map(({ name }) => `${name} is the winner!`),
    getOrElse(() => `It's a draw.`)
  )
const contest2 = (p1: Player, p2: Player): void => console.log(winnerMsg(winner(p1, p2)))
// メッセージと出力を分けることで、別の出力方法（ファイルへの書き出し等）への変更が容易になる。
// point1 副作用である console.log がプログラムの最も外側のレイヤにのみ存在するようになった
// point2 console.log の呼び出しの内側にあるのが純粋な式になった

// 13.2 単純な IO 型
const contest3 = (p1: Player, p2: Player): IO<void> => log(winnerMsg(winner(p1, p2)))
// contest3 の役割はただ 1 つ、プログラムの各部分を合成すること
// point: constest が純粋関数になった

/**
 * dev.to の 記事より
 *
 * title: Getting started with fp-ts: IO
 * url: https://dev.to/gcanti/getting-started-with-fp-ts-io-36p6
 */

// Example (Dungeons and Dragons)
type Die = IO<number>

const monoidDie: Monoid<Die> = getApplicativeMonoid(Applicative)(MonoidSum)

/** returns the sum of the roll of the dice */
const roll: (dice: Array<Die>) => IO<number> = concatAll(monoidDie)

const D4: Die = randomInt(1, 4)
const D10: Die = randomInt(1, 10)
const D20: Die = randomInt(1, 20)

const dice = [D4, D10, D20]

export const DungeonsAndDragons = MonadIO.chain(roll(dice), (result) => log(`Result is: ${result}`))

/** Log any value to the console for debugging purposes */
const withLogging = <A>(action: IO<A>): IO<A> =>
  MonadIO.chain(action, (a) => MonadIO.map(log(`Value is: ${a}`), () => a))

export const DungeonsAndDragonsDebug = MonadIO.chain(roll(dice.map(withLogging)), (result) =>
  log(`Result is: ${result}`)
)

// Error handling
export const readFileSync = (path: string): IOEither<Error, string> =>
  tryCatch(() => fs.readFileSync(path, 'utf8'), toError)

const randomFile = IOEMonad.chain(rightIO(randomInt(1, 3)), (n) => readFileSync(path.resolve(__dirname, `${n}.txt`)))
