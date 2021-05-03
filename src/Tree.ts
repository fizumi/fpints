/* eslint-disable no-use-before-define */
import * as R from 'ramda'
import { max } from 'ramda'

// 3.5 ツリー
// リスト 3-4
interface Leaf<A> {
  _tag: 'leaf'
  value: A
}
interface Branch<A> {
  _tag: 'branch'
  left: Tree<A>
  right: Tree<A>
}
export type Tree<A> = Leaf<A> | Branch<A>
export const leaf = <A>(value: A): Tree<A> => ({
  _tag: 'leaf',
  value,
})
export const branch = <A>(left: Tree<A>, right: Tree<A>): Tree<A> => ({
  _tag: 'branch',
  left,
  right,
})

export const isLeaf = <A>(t: Tree<A>): t is Leaf<A> => t._tag === 'leaf'

//  EXERCISE 3.25
export const size = <A>(t: Tree<A>): number => {
  if (isLeaf(t)) return 1
  return 1 + size(t.left) + size(t.right)
}

// EXERCISE 3.26
export const maximum = (t: Tree<R.Ord>): R.Ord => {
  if (isLeaf(t)) return t.value
  return max(maximum(t.left), maximum(t.right))
}

// EXERCISE 3.27
export const depth = <A>(t: Tree<A>): number => {
  if (isLeaf(t)) return 0
  return 1 + max(depth(t.left), depth(t.right))
}

// EXERCISE 3.28
export const map = <A>(t: Tree<A>) => <B>(f: (a: A) => B): Tree<B> => {
  if (isLeaf(t)) return leaf(f(t.value))
  return branch(map(t.left)(f), map(t.right)(f))
}

// EXERCISE 3.29
export const fold = <A>(t: Tree<A>) => <B>(f: (a: A) => B) => (g: (bl: B, br: B) => B): B => {
  if (isLeaf(t)) return f(t.value)
  return g(fold(t.left)(f)(g), fold(t.right)(f)(g))
}

export const sizeViaFold = <A>(t: Tree<A>): number => fold(t)((_) => 1)((l, r) => 1 + l + r)

export const maximumViaFold = (t: Tree<R.Ord>): R.Ord => fold(t)((a) => a)(max)

export const depthViaFold = <A>(t: Tree<A>): number => fold(t)((_) => 0)((l, r) => 1 + max(l, r))

export const mapViaFold = <A>(t: Tree<A>) => <B>(f: (a: A) => B): Tree<B> => fold(t)((a) => leaf(f(a)))(branch)
