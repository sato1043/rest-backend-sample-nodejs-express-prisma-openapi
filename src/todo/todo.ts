/**
 * Todo:
 *  - TODO にまつわるドメインモデル（とドメインロジック）を記述する
 */

import { Prisma } from '@prisma/client'
import pick from 'lodash.pick'

import type { Todo as PrismaClient_Todo } from '@prisma/client'

export type Todo = PrismaClient_Todo & {
  strip: () => PrismaClient_Todo
}

export function newTodo(originalProps: PrismaClient_Todo): Todo {
  return {
    ...originalProps,

    strip() {
      return stripTodo(this)
    },
  }
}

const OriginalKeys = Object.keys(Prisma.TodoScalarFieldEnum) as (keyof PrismaClient_Todo)[]
export function stripTodo(dressed: Todo): PrismaClient_Todo {
  return pick(dressed, OriginalKeys)
}
