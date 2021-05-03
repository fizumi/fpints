import {
  stringMonoid,
  arrayMonoid,
  numberAddition,
  optionMonoid,
  objectMonoid,
  endoMonoid,
  isMonoid,
  productMonoid,
  functionMonoid,
  concatenate,
  bag,
  mean,
  TreeFoldable,
  numberMultiplication,
} from './Monoid'
import { Some, None } from './Option'
import { branch, leaf } from './Tree'
import { equals } from 'ramda'

test('isMonoid', (): void => {
  type SNT = [string, number]
  expect(isMonoid(stringMonoid, 'a', 'b', 'c', equals)).toBe(true)
  expect(isMonoid(numberAddition, 1, 2, 3, equals)).toBe(true)
  expect(isMonoid(arrayMonoid(), [1, 2], ['1', '2'], ['a'], equals)).toBe(true)
  expect(isMonoid(objectMonoid<string, number>(), { a: 1 }, { b: 2 }, { c: 3 }, equals)).toBe(true)
  expect(isMonoid(optionMonoid<string>(), Some('a'), Some('b'), Some('c'), equals)).toBe(true)
  expect(
    isMonoid(productMonoid(stringMonoid, numberAddition), ['a', 1] as SNT, ['b', 2] as SNT, ['c', 3] as SNT, equals)
  ).toBe(true)
})

test('endoMonoid', (): void => {
  const [x, y, z] = [(n: number) => n + 1, (n: number) => n * 2, (n: number) => n - 3]
  expect(isMonoid(endoMonoid<number>(), x, y, z, (a1, a2) => a1(2) === a2(2))).toBe(true)
})
test('functionMonoid', (): void => {
  const monoidInstances = functionMonoid<number, string>(stringMonoid)
  const [x, y, z] = [(n: number) => n.toString(), (n: number) => n.toFixed(), (n: number) => n.toExponential()]
  expect(isMonoid(monoidInstances, x, y, z, (a1, a2) => a1(123) === a2(123))).toBe(true)
})

test('concatenate', (): void => {
  expect(concatenate(['a', 'rose', 'is', 'a', 'rose'], stringMonoid)).toEqual('aroseisarose')
  expect(concatenate([Some('a'), None, Some('b')], optionMonoid<string>()).getOrElse('')).toEqual('a')
})

test('bag', (): void => {
  // prettier-ignore
  expect(bag(['a', 'rose', 'is', 'a', 'rose'])).toEqual( new Map([ ['a', 2], ['rose', 2], ['is', 1], ]))
})

test('mean', (): void => {
  expect(mean([10, 20, 30]).getOrElse(0)).toEqual(20)
})

const tree = branch(branch(leaf('Ll'), leaf('Lr')), branch(leaf('Rl'), branch(leaf('Rrl'), leaf('Rrr'))))
const foldableInstance = new TreeFoldable()
test('TreeFoldable.foldRight', (): void => {
  expect(foldableInstance.foldRight(tree)('z')((a, b) => a + b)).toEqual('LlLrRlRrlRrrz')
})
test('TreeFoldable.foldLeft', (): void => {
  expect(foldableInstance.foldLeft(tree)('z')((a, b) => a + b)).toEqual('zLlLrRlRrlRrr')
  expect(foldableInstance.foldLeft_failure(tree)('z')((a, b) => a + b)).toEqual('zRrrRrlRlLrLl')
})
test('TreeFoldable.concatenate', (): void => {
  expect(foldableInstance.concatenate(tree)(stringMonoid)).toEqual('LlLrRlRrlRrr')
  expect(foldableInstance.concatenateR(tree)(stringMonoid)).toEqual('LlLrRlRrlRrr')
})
test('TreeFoldable.foldMap', (): void => {
  expect(foldableInstance.foldMap(tree)((a) => a.length)(numberMultiplication)).toEqual(72)
})
test('TreeFoldable.toList', (): void => {
  expect(foldableInstance.toList(tree)).toEqual(['Ll', 'Lr', 'Rl', 'Rrl', 'Rrr'])
})
test('TreeFoldable.toListViaMonoid', (): void => {
  expect(foldableInstance.toListViaMonoid(tree)).toEqual(['Ll', 'Lr', 'Rl', 'Rrl', 'Rrr'])
})
