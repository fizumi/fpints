import { branch, leaf, size, maximum, depth, map, sizeViaFold, maximumViaFold, depthViaFold, mapViaFold } from './Tree'

const data = branch(branch(leaf('a'), leaf('b')), branch(leaf('c'), leaf('d')))

test('size', (): void => {
  expect(size(data)).toEqual(7)
  expect(sizeViaFold(data)).toEqual(7)
})
test('maximum', (): void => {
  expect(maximum(data)).toEqual('d')
  expect(maximumViaFold(data)).toEqual('d')
})
test('depth', (): void => {
  expect(depth(data)).toEqual(2)
  expect(depthViaFold(data)).toEqual(2)
})
test('map', (): void => {
  expect(map(data)((x) => x + '+')).toEqual(mapViaFold(data)((x) => x + '+'))
})
