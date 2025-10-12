import { Todo as PrismaClient_Todo } from '@prisma/client'
import { Request, Response } from 'express'

import { TodoFactory } from '../../prisma/factories/todo.factory'
import { Error400, Error404, Error409, Error422 } from '../util/express.util'

import { newTodo, Todo } from './todo'
import { TodoAppLogic } from './todo.app-logic'
import {
  TodoRoutes,
  fitToJson,
  TodoRouteTodoIdPathType,
  TodoRouteCreateReqBodyType,
  TodoRouteUpdateReqBodyType,
} from './todo.routes'

jest.mock('./todo.app-logic')

describe('TodoRoutes', () => {
  const mockedTodoAppLogic = TodoAppLogic as jest.Mocked<typeof TodoAppLogic>

  let list: PrismaClient_Todo[]
  beforeEach(async () => {
    list = [
      TodoFactory.getValue(),
      TodoFactory.getValue(),
      TodoFactory.getValue(),
      TodoFactory.getValue(),
    ]
  })

  describe('TodoRoutes.todoList: 全件取得するルートのハンドラー', () => {
    // TODO implement
  })

  describe('TodoRoutes.todoCreate: １件作成するルートのハンドラー', () => {
    let todo: Todo
    let todoId: Todo['todoId']
    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock

    beforeEach(() => {
      todo = newTodo(list[0])
      todoId = todo.todoId
      req = {
        body: {} as TodoRouteCreateReqBodyType as any,
      }
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
    })

    it('TODOを１件作成できる', async () => {
      mockedTodoAppLogic.create.mockResolvedValue(todo)
      // @ts-ignore
      await TodoRoutes.todoCreate[0](req, res, next)
      expect(res.status).toHaveBeenNthCalledWith(1, 201)
      expect(res.json).toHaveBeenNthCalledWith(1, fitToJson(todo))
      expect(next).not.toHaveBeenCalled()
    })

    it('TODOを１件時作成に例外なら Error409 で扱う', async () => {
      mockedTodoAppLogic.create.mockImplementation(() => {
        throw new Error()
      })
      // @ts-ignore
      await TodoRoutes.todoCreate[0](req, res, next) // 落ちずに next が呼ばれれば期待通り
      expect(next).toHaveBeenNthCalledWith(1, Error409)
    })
  })

  describe('TodoRoutes.todoUpdate: １件更新するルートのハンドラー', () => {
    let todo: Todo
    let todoId: Todo['todoId']
    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock

    beforeEach(() => {
      todo = newTodo(list[0])
      todoId = todo.todoId
      req = {
        params: { todoId } as TodoRouteTodoIdPathType as any,
        body: {} as TodoRouteUpdateReqBodyType as any,
      }
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
    })

    it('TODOを１件更新できる', async () => {
      req.body = { name: 'testName', email: 'testEmail' }
      mockedTodoAppLogic.update.mockResolvedValue(todo)
      // @ts-ignore
      await TodoRoutes.todoUpdate[0](req, res, next)
      expect(res.status).toHaveBeenNthCalledWith(1, 200)
      expect(res.json).toHaveBeenNthCalledWith(1, fitToJson(todo))
      expect(next).not.toHaveBeenCalled()
    })

    it('TODO１件更新でパラメータがひとつもないときError400', async () => {
      req.body = {}
      mockedTodoAppLogic.update.mockResolvedValue(todo)
      // @ts-ignore
      await TodoRoutes.todoUpdate[0](req, res, next)
      expect(next).toHaveBeenNthCalledWith(1, Error400)
    })

    it('TODOを１件更新時に例外なら Error422 で扱う', async () => {
      req.body = { name: 'testName', email: 'testEmail' }
      mockedTodoAppLogic.update.mockImplementation(() => {
        throw new Error()
      })
      // @ts-ignore
      await TodoRoutes.todoUpdate[0](req, res, next)
      expect(next).toHaveBeenNthCalledWith(1, Error422)
    })
  })

  describe('TodoRoutes.todoDelete: １件削除するルートのハンドラー', () => {
    let todo: Todo
    let todoId: Todo['todoId']
    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock

    beforeEach(() => {
      todo = newTodo(list[0])
      todoId = todo.todoId
      req = {
        params: { todoId } as TodoRouteTodoIdPathType as any,
      }
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
    })

    it('TODOを１件削除できる', async () => {
      mockedTodoAppLogic.delete.mockResolvedValue(todo)
      // @ts-ignore
      await TodoRoutes.todoDelete[0](req, res, next)
      expect(res.status).toHaveBeenNthCalledWith(1, 204)
      expect(res.json).toHaveBeenNthCalledWith(1, fitToJson(todo))
      expect(next).not.toHaveBeenCalled()
    })

    it('TODOを１件削除時に例外なら Error422 で扱う', async () => {
      mockedTodoAppLogic.delete.mockImplementation(() => {
        throw new Error()
      })
      // @ts-ignore
      await TodoRoutes.todoDelete[0](req, res, next)
      expect(next).toHaveBeenNthCalledWith(1, Error422)
    })
  })

  describe('TodoRoutes.todoGet: １件取得するルートのハンドラー', () => {
    let todo: Todo
    let todoId: Todo['todoId']
    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock

    beforeEach(() => {
      todo = newTodo(list[0])
      todoId = todo.todoId
      req = {
        params: { todoId } as TodoRouteTodoIdPathType as any,
        // query: { } as ReqQueryType as any,
      }
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
    })

    it('TODOを１件取得できる', async () => {
      mockedTodoAppLogic.get.mockResolvedValue(todo)
      // @ts-ignore
      await TodoRoutes.todoGet[0](req, res, next)
      expect(res.status).toHaveBeenNthCalledWith(1, 200)
      expect(res.json).toHaveBeenNthCalledWith(1, fitToJson(todo))
      expect(next).not.toHaveBeenCalled()
    })

    it('TODOを１件取得時に例外なら Error404 で扱う', async () => {
      mockedTodoAppLogic.get.mockImplementation(() => {
        throw new Error()
      })
      // @ts-ignore
      await TodoRoutes.todoGet[0](req, res, next)
      expect(next).toHaveBeenNthCalledWith(1, Error404)
    })
  })
})
