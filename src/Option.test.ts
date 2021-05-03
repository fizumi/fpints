import Option, { sequence, sequence_1, sequence_2, Some, None, variance } from './Option'
import { optionMonad } from './Monad'

test('variance', (): void => {
  expect(variance([71, 80, 89]).getOrElse(0)).toBe(54)
  expect(variance([])).toEqual(None)
})

test('sequence', (): void => {
  // prettier-ignore
  const data = [
    // [datas                    , expected]
    [[]                          , Some([])],
    [[Some(1)]                   , Some([1])],
    [[None]                      , None],
    [[Some(1), Some(2)]          , Some([1,2])],
    [[None,    Some(1)]          , None],
    [[Some(1), None]             , None],
    [[None,    None]             , None],
    [[Some(1), Some(2), Some(3)] , Some([1,2,3])],
    [[Some(1), None,    Some(3)] , None],
  ] as Array<[Option<number>[] , Option<number[]>]>

  data.forEach(([arg, expected]) => {
    expect(sequence(arg).getOrElse([])).toEqual(expected.getOrElse([]))
    expect(sequence_1(arg).getOrElse([])).toEqual(expected.getOrElse([]))
    expect(sequence_2(arg).getOrElse([])).toEqual(expected.getOrElse([]))
    expect(optionMonad.sequence(arg).getOrElse([])).toEqual(expected.getOrElse([]))
  })
})
