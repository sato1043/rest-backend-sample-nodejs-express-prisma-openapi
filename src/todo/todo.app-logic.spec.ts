import { Todo as PrismaClient_Todo } from '@prisma/client'

// @ts-ignore
import { TodoFactory } from '../../prisma/factories/todo.factory'
import $c from '../config'

import { stripTodo } from './todo'
import { TodoAppLogic } from './todo.app-logic'

// 以下
// TodoAppLogic 仕様:
describe('TodoAppLogic:', () => {
  let list: PrismaClient_Todo[]
  beforeEach(async () => {
    list = [
      await TodoFactory.create(),
      await TodoFactory.create(),
      await TodoFactory.create(),
      await TodoFactory.create(),
    ]
  })

  describe('TodoAppLogic.list: 全件取得', () => {
    it('TODOが存在しないくとも全件取得は成功するが空配列が返る', async () => {
      await $c.prisma.$queryRaw`SET FOREIGN_KEY_CHECKS=0`
      await $c.prisma.$queryRawUnsafe(`TRUNCATE TABLE todos`)
      await $c.prisma.$queryRaw`SET FOREIGN_KEY_CHECKS=1`
      const actual = await TodoAppLogic.list()
      expect(actual.list).toHaveLength(0)
    })
    it('TODOを全件取得できる', async () => {
      const actual = await TodoAppLogic.list()
      expect(actual.list.map(stripTodo)).toStrictEqual(list)
    })
  })

  describe('TodoAppLogic.create: １件作成', () => {
    it('TODOを１件作成できる', async () => {
      const data = TodoFactory.build()
      const actual = await TodoAppLogic.create({ data })
      expect(actual.strip()).toMatchObject(data)
    })
    it('TODOを重複で１件作成できない', async () => {
      await expect(TodoAppLogic.create({ data: list[2] })).rejects.toThrow()
    })
  })

  describe('TodoAppLogic.update: １件更新', () => {
    it('TODOを１件更新できる', async () => {
      const where = { todoId: list[2].todoId }
      const data = TodoFactory.build()
      const actual = await TodoAppLogic.update({ where, data })
      expect(actual.strip()).toMatchObject({ ...list[2], ...data })
    })
  })

  describe('TodoAppLogic.delete: １件削除', () => {
    it('TODOを１件削除できる', async () => {
      const actual = await TodoAppLogic.delete({ where: { todoId: list[2].todoId } })
      expect(actual.strip()).toStrictEqual(list[2])
      await expect(TodoAppLogic.get({ where: { todoId: list[2].todoId } })).rejects.toThrow()
    })
    it('存在しないTODOは１件削除できない', async () => {
      await expect(TodoAppLogic.delete({ where: { todoId: 0 } })).rejects.toThrow()
    })
  })

  describe('TodoAppLogic.get: １件取得', () => {
    it('TODOを１件取得できる', async () => {
      const actual = await TodoAppLogic.get({ where: { todoId: list[2].todoId } })
      expect(actual && actual.strip()).toStrictEqual(list[2])
    })
    it('存在しないTODOは１件取得できない', async () => {
      await expect(TodoAppLogic.get({ where: { todoId: 0 } })).rejects.toThrow()
    })
  })
})
