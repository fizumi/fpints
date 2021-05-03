import { append } from './utils'
import {
  Monad,
  State as State_,
  get as get_,
  put as set_,
  map as map_,
  Applicative as stateApplicative,
  chain,
  bindTo,
  bind,
} from 'fp-ts/State'
import { Do } from 'fp-ts-contrib/lib/Do'
import { pipe, flow, constVoid } from 'fp-ts/function'
import { sequenceT, sequenceS } from 'fp-ts/Apply'
import { sequence as sequence_, replicate } from 'fp-ts/Array'

// リスト 6-8
// EXERCISE 6.10
export default class State<S, A> {
  constructor(public run: (s: S) => [A, S]) {}
  map = <B>(f: (a: A) => B): State<S, B> => this.flatMap((a) => unit(f(a)))
  map2 = <B>(sb: State<S, B>) => <C>(f: (a: A, b: B) => C): State<S, C> => this.flatMap((a) => sb.map((b) => f(a, b)))
  flatMap = <B>(f: (a: A) => State<S, B>): State<S, B> =>
    statement((s) => {
      const [a, s1] = this.run(s)
      return f(a).run(s1)
    })

  map_verbose = <B>(f: (a: A) => B): State<S, B> =>
    statement((s) => {
      const [a, s1] = this.run(s)
      return [f(a), s1]
    })

  map2_verbose = <B>(sb: State<S, B>) => <C>(f: (a: A, b: B) => C): State<S, C> =>
    statement((sa) => {
      const [a, s1] = this.run(sa)
      const [b, s2] = sb.run(s1)
      return [f(a, b), s2]
    })
}

export const unit = <S, A>(a: A): State<S, A> => statement((s: S) => [a, s])

export const sequence = <S, A>(ss: State<S, A>[]): State<S, A[]> =>
  ss.reduceRight<State<S, A[]>>((acc, s) => s.map2(acc)(append), unit([] as A[]))
export const sequenceLeft = <S, A>(ss: State<S, A>[]): State<S, A[]> =>
  ss.reduce<State<S, A[]>>((acc, s) => s.map2(acc)(append), unit([] as A[]))

export const modify = <S>(f: (s: S) => S): State<S, void> => statement((s: S) => [undefined, f(s)])
export const modify_1 = <S>(f: (s: S) => S): State<S, void> => get<S>().flatMap((s) => set(f(s)))
// fp-ts ver --
export const modify_do = <S>(f: (s: S) => S): State_<S, void> =>
  Do(Monad)
    .bind('s', get_<S>())
    .doL(({ s }) => set_(f(s)))
    .return(constVoid)
export const modify_bind = <S>(f: (s: S) => S): State_<S, void> =>
  pipe(
    bindTo('s')(get_<S>()),
    bind('_', ({ s }) => set_(f(s))),
    map_(constVoid)
  )
// -- fp-ts ver

export const get = <S>(): State<S, S> => statement((s) => [s, s])
export const set = <S>(s: S): State<S, void> => statement((_) => [undefined, s]) // put

export const VALUE = 0
export const STATE = 1

const statement = <S, A>(run: (s: S) => [A, S]): State<S, A> => new State(run)

// EXERCISE 6.11
export class Machine {
  constructor(public locked: boolean, public candies: number, public coins: number) {}
}
export const coin = 'coin'
export const turn = 'turn'
type Input = typeof coin | typeof turn

const update = (i: Input) => (s: Machine): Machine | never => {
  if (s.candies === 0) return s
  if (i === coin && !s.locked) return s
  if (i === turn && s.locked) return s
  if (i === coin && s.locked && s.candies && s.coins) return new Machine(false, s.candies, s.coins + 1)
  if (i === turn && !s.locked && s.candies && s.coins) return new Machine(true, s.candies - 1, s.coins)
  throw new Error('Match Error')
}

export const simulateMachine = (inputs: Input[]): State<Machine, [number, number]> =>
  sequence(inputs.map(flow(update, modify)))
    .flatMap((_) => get<Machine>())
    .map((s) => [s.candies, s.coins])

/**
 * paulgray.net の blog より
 *
 * title: The State monad
 * url: https://paulgray.net/the-state-monad/
 */
type Random<A> = State_<number, A>

const random: Random<number> = (seed) => {
  const nextSeed = (1839567234 * seed + 972348567) % 8239451023
  return [nextSeed, nextSeed]
}
const randomInRange = (max: number, min: number): Random<number> => {
  const inRange = (num: number) => {
    // change num so that it's between max and min
    return min + Math.round((num / 8239451023) * (max - min))
  }
  return map_(inRange)(random)
}

const pickRandom = <A>(list: A[]): Random<A> =>
  pipe(
    randomInRange(0, list.length - 1),
    map_((index) => list[index])
  )

const randomFirstName = pickRandom(['Paul', 'Nicole', 'Zane', 'Ellie'])
const randomLastName = pickRandom(['Gray', 'Smith', 'Jones', 'Williams'])
const randomFullname = pipe(
  sequenceT(stateApplicative)(randomFirstName, randomLastName),
  map_(([first, last]) => `${first} ${last}`)
)
const randomHockeyTeam = pickRandom(['Maple Leafs', 'Canadiens', 'Flyers', 'Bruins'])
const randomFootballTeam = pickRandom(['Steelers', 'Eagles', 'Jaguars'])
const randomBoolean: Random<boolean> = pipe(
  randomInRange(0, 1),
  map_((n) => n === 1) // return true if it is 1, false if it is 0
)

const randomTeam: Random<string> = pipe(
  randomBoolean,
  chain((bool) => (bool ? randomHockeyTeam : randomFootballTeam))
)

interface RandomUser {
  name: string
  age: number
  favoriteTeam: string
}

export const generateRandomUser = sequenceS(stateApplicative)({
  name: randomFullname,
  age: randomInRange(18, 100),
  favoriteTeam: randomTeam,
})

export const generateRandomUsers: (count: number) => Random<RandomUser[]> = (count) => (seed) => {
  if (count === 0) {
    return [[] as RandomUser[], seed]
  } else {
    const [x, r1] = generateRandomUser(seed)
    const [xs, r2] = generateRandomUsers(count - 1)(r1)
    return [[x, ...xs], r2]
  }
}

export const generateRandomUsers_: (count: number) => Random<RandomUser[]> = (count) =>
  sequence_(stateApplicative)(replicate(count, generateRandomUser))
