// line 1
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { DungeonsAndDragons, DungeonsAndDragonsDebug, readFileSync } from './IO'

test('DungeonsAndDragons', (): void => {
  DungeonsAndDragons()
  DungeonsAndDragonsDebug()
})
test('readFileSync error', (): void => {
  expect(readFileSync('foo')()).toEqual(E.left(new Error("Error: ENOENT: no such file or directory, open 'foo'")))
})
test('readFileSync', (): void => {
  pipe(
    readFileSync(__filename)(),
    E.map((x) => expect(x.split('\n')[0]).toBe('// line 1'))
  )
})
