import {
  VALUE,
  Machine,
  simulateMachine,
  coin,
  turn,
  generateRandomUser,
  generateRandomUsers,
  generateRandomUsers_,
} from './State'
import { evaluate } from 'fp-ts/State'

test('simulateMachine', (): void => {
  expect(simulateMachine([coin]).run(new Machine(true, 5, 10))[VALUE]).toEqual([5, 11])
  expect(simulateMachine([turn]).run(new Machine(true, 5, 10))[VALUE]).toEqual([5, 10])
  expect(simulateMachine([coin, turn]).run(new Machine(true, 5, 10))[VALUE]).toEqual([4, 11])
  expect(
    simulateMachine([coin, turn, coin, turn, coin, turn, coin, turn]).run(new Machine(true, 5, 10))[VALUE]
  ).toEqual([1, 14])
  expect(
    simulateMachine([turn, coin, turn, coin, turn, coin, turn, coin, turn, turn]).run(new Machine(true, 5, 10))[VALUE]
  ).toEqual([1, 14])
})

test('generateRandomUser', (): void => {
  const seed = 1337
  const expected = [
    { name: 'Nicole Jones', age: 80, favoriteTeam: 'Jaguars' },
    { name: 'Ellie Smith', age: 38, favoriteTeam: 'Flyers' },
    { name: 'Nicole Gray', age: 92, favoriteTeam: 'Eagles' },
    { name: 'Nicole Smith', age: 35, favoriteTeam: 'Eagles' },
    { name: 'Paul Smith', age: 86, favoriteTeam: 'Eagles' },
    { name: 'Nicole Williams', age: 36, favoriteTeam: 'Eagles' },
    { name: 'Ellie Smith', age: 77, favoriteTeam: 'Eagles' },
    { name: 'Nicole Gray', age: 64, favoriteTeam: 'Steelers' },
    { name: 'Ellie Gray', age: 29, favoriteTeam: 'Flyers' },
    { name: 'Nicole Jones', age: 23, favoriteTeam: 'Maple Leafs' },
    { name: 'Zane Smith', age: 86, favoriteTeam: 'Maple Leafs' },
    { name: 'Nicole Jones', age: 28, favoriteTeam: 'Eagles' },
    { name: 'Paul Jones', age: 53, favoriteTeam: 'Eagles' },
    { name: 'Nicole Jones', age: 26, favoriteTeam: 'Canadiens' },
    { name: 'Zane Jones', age: 39, favoriteTeam: 'Bruins' },
  ]
  expect(evaluate(seed)(generateRandomUser)).toEqual(expected[0])
  expect(evaluate(seed)(generateRandomUsers(15))).toEqual(expected)
  expect(evaluate(seed)(generateRandomUsers_(15))).toEqual(expected)
})
