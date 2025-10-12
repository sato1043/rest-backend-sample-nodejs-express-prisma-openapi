/**
 * TodoAppLogic:
 *  - TODO にまつわる（システム由来の）アプリケーションロジックを記述する
 */

import $c from '../config'

import { Todo, newTodo } from './todo'
export { Todo }

export interface TodoAppLogic {
  list: (args?: Parameters<typeof $c.prisma.todo.findMany>[0]) => Promise<{
    perPage: number
    pageTotal: number
    currentPageNo: number
    list: Todo[]
  }>
  create: (args: Parameters<typeof $c.prisma.todo.create>[0]) => Promise<Todo>
  update: (args: Parameters<typeof $c.prisma.todo.update>[0]) => Promise<Todo>
  delete: (args: Parameters<typeof $c.prisma.todo.delete>[0]) => Promise<Todo>
  get: (args: NonNullable<Parameters<typeof $c.prisma.todo.findUniqueOrThrow>[0]>) => Promise<Todo>
}

function createTodoAppLogic(): TodoAppLogic {
  return {
    list: async (args) => {
      const list = (await $c.prisma.todo.findMany(args)).map((o) => newTodo(o))
      return {
        perPage: 50, // TODO parameterize
        pageTotal: 1,
        currentPageNo: 1,
        list,
      }
    },
    create: async (args) => {
      const todo = await $c.prisma.todo.create(args)
      return newTodo(todo)
    },
    update: async (args) => {
      const todo = await $c.prisma.todo.update(args)
      return newTodo(todo)
    },
    delete: async (args) => {
      const todo = await $c.prisma.todo.delete(args)
      return newTodo(todo)
    },
    get: async (args) => {
      const todo = await $c.prisma.todo.findUniqueOrThrow(args)
      return newTodo(todo)
    },
  }
}

export const TodoAppLogic = createTodoAppLogic()
