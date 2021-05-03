import { left, right } from 'fp-ts/Either'
import { validatePassword, validatePassword_original } from './Applicative'

test('validatePassword', (): void => {
  expect(validatePassword_original('ab')).toEqual(
    left(['at least 6 characters', 'at least one capital letter', 'at least one number'])
  )
  expect(validatePassword('aB')).toEqual(left(['at least 6 characters', 'at least one number']))
  expect(validatePassword('aB3456')).toEqual(right('aB3456'))
})
