import { h, h_, h__, instance, instance_ } from './Reader'

test('h__', (): void => {
  expect(h__('f')).toBe('false')
  expect(h__('foo')).toBe('true')
})
test('h_', (): void => {
  expect(h_('foo', instance_)).toBe('真')
})
test('h', (): void => {
  expect(h('foo')(instance)).toBe('vero')
  expect(h('foo')({ ...instance, lowerBound: 4 })).toBe('falso')
})
