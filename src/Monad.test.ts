import {
  optionMonad,
  arrayMonad,
  isMonad,
  zipWithIndex,
  zipWithIndex2,
  zipWithIndex3,
  optionMap2,
  optionMap2_withPipe,
  optionMap2_withBind,
} from './Monad'

import Option, { Some, None } from './Option'
import { equals } from 'ramda'
import * as O from 'fp-ts/Option'

test('Monad instance', (): void => {
  const double = (x: number): number => x * 2
  expect(optionMonad.map(Some(1))(double).getOrElse(0)).toEqual(2)
  expect(optionMonad.map<number>(None)(double).getOrElse(0)).toEqual(0)
  expect(optionMonad.replicateM<number>(3, Some(1)).getOrElse([])).toEqual([1, 1, 1])
  expect(arrayMonad.join([['0']])).toEqual(['0'])
  expect(arrayMonad.map([1, 2])(double)).toEqual([2, 4])
  // prettier-ignore
  expect(arrayMonad.distribute([[1,'1'],[2,'2'],[3,'3']])).toEqual([[1,2,3],['1','2','3']])
})

test('monadArrayInstance isMonad', (): void => {
  const f = (a: number) => [a.toString()]
  const g = (b: string) => [b.length]
  const h = (c: number) => ['d' + c]
  const compAD = (ad1: (a: number) => Array<string>, ad2: (a: number) => Array<string>): boolean =>
    equals([...ad1(10)], [...ad2(10)])
  const compAB = (ab1: (a: number) => Array<string>, ab2: (a: number) => Array<string>): boolean =>
    equals([...ab1(10)], [...ab2(10)])
  expect(isMonad<'Array', number, string, number, string>(arrayMonad, f, g, h, compAD, compAB)).toBe(true)
})
test('monadOptionInstance isMonad', (): void => {
  const f = (a: number) => Some(a.toString())
  const g = (b: string) => Some(b.length)
  const h = (c: number) => Some('d' + c)
  const compAD = (ad1: (a: number) => Option<string>, ad2: (a: number) => Option<string>): boolean =>
    equals(ad1(10).getOrElse('a'), ad2(10).getOrElse('b'))
  const compAB = (ab1: (a: number) => Option<string>, ab2: (a: number) => Option<string>): boolean =>
    equals(ab1(10).getOrElse('a'), ab2(10).getOrElse('b'))
  expect(isMonad<'Option', number, string, number, string>(optionMonad, f, g, h, compAD, compAB)).toBe(true)
})
test('zipWithIndex', (): void => {
  // prettier-ignore
  expect(zipWithIndex(['a', 'b', 'c'])).toEqual([[0, 'a'], [1, 'b'], [2, 'c']])
  // prettier-ignore
  expect(zipWithIndex2(['a', 'b', 'c'])).toEqual([[0, 'a'], [1, 'b'], [2, 'c']])
  // prettier-ignore
  expect(zipWithIndex3(['a', 'b', 'c'])).toEqual([[0, 'a'], [1, 'b'], [2, 'c']])
})

test('map2', (): void => {
  const sum = (a: number, b: number) => a + b
  expect(optionMonad.map2(Some(1), Some(2))(sum).getOrElse(0)).toBe(3)
  expect(optionMap2(O.some(1), O.some(2), sum)).toEqual(O.some(3))
  expect(optionMap2_withPipe(O.some(1), O.some(2), sum)).toEqual(O.some(3))
  expect(optionMap2_withBind(O.some(1), O.some(2), sum)).toEqual(O.some(3))
})
