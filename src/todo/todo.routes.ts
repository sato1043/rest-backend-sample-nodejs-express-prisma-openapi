import { formatISO } from 'date-fns'
import { Request, Handler } from 'express'

import { components, operations, paths } from '../types/openapi.schema'
import {
  wrapPromisedRequestHandler,
  PromisedRequestHandler,
  Error409,
  Error500,
  Error400,
  Error422,
  Error404,
} from '../util/express.util'

import { Todo } from "./todo"
import { TodoAppLogic } from "./todo.app-logic"

export type TodoJson = components['schemas']['Todo']
export type TodoRouteTodoIdPathType = paths['/todos/{todoId}']['parameters']['path']
export type TodoRouteCreateReqBodyType =
  operations['todoCreate']['requestBody']['content']['application/json']
export type TodoRouteUpdateReqBodyType =
  operations['todoUpdate']['requestBody']['content']['application/json']

export const fitToJson = (todo: Todo): TodoJson => ({
  ...todo.strip(),
  createdAt: formatISO(todo.createdAt),
  updatedAt: formatISO(todo.createdAt),
})

const extractTodoIdFromPathParams = (pathParams: Request['params']) => {
  if (!pathParams.todoId) throw Error400
  return Number(pathParams.todoId)
}

export function createTodoRoutes(): { [operationId: string]: Handler[] } {
  const todoList: PromisedRequestHandler = async (req, res, next) => {
    type ReqQueryType = operations['todoList']['parameters']['query']
    type ResBodyType = operations['todoList']['responses'][200]['content']['application/json']
    const query: ReqQueryType = req.query
    try {
      const result = await TodoAppLogic.list({}) // TODO move parameters inside app-logic
      const json: ResBodyType = {
        ...result,
        list: result.list.map(fitToJson),
      }
      res.status(200).json(json)
    } catch (e) {
      console.error({ 'TodoRoutes.todoList': e })
      throw Error500
    }
  }

  const todoCreate: PromisedRequestHandler = async (req, res) => {
    try {
      const data: TodoRouteCreateReqBodyType = req.body
      const todo = await TodoAppLogic.create({ data })
      res.status(201).json(fitToJson(todo))
    } catch (e) {
      console.error({ 'TodoRoutes.todoCreate': e })
      throw Error409
    }
  }

  const todoUpdate: PromisedRequestHandler = async (req, res) => {
    const todoId = extractTodoIdFromPathParams(req.params)
    const data: TodoRouteUpdateReqBodyType = req.body
    if (!data.name && !data.email) {
      throw Error400
    }
    try {
      const todo = await TodoAppLogic.update({
        where: { todoId },
        data,
      })
      res.status(200).json(fitToJson(todo))
    } catch (e) {
      console.error({ 'TodoRoutes.todoUpdate': e })
      throw Error422
    }
  }

  const todoDelete: PromisedRequestHandler = async (req, res) => {
    const todoId = extractTodoIdFromPathParams(req.params)
    try {
      const todo = await TodoAppLogic.delete({ where: { todoId } })
      res.status(204).json(fitToJson(todo))
    } catch (e) {
      console.error({ 'TodoRoutes.todoDelete': e })
      throw Error422
    }
  }

  const todoGet: PromisedRequestHandler = async (req, res) => {
    const todoId = extractTodoIdFromPathParams(req.params)
    try {
      const todo = await TodoAppLogic.get({ where: { todoId } })
      res.status(200).json(fitToJson(todo))
    } catch (e) {
      console.error({ 'TodoRoutes.todoGet': e })
      throw Error404
    }
  }

  return {
    todoList: [wrapPromisedRequestHandler(todoList)],
    todoCreate: [wrapPromisedRequestHandler(todoCreate)],
    todoUpdate: [wrapPromisedRequestHandler(todoUpdate)],
    todoDelete: [wrapPromisedRequestHandler(todoDelete)],
    todoGet: [wrapPromisedRequestHandler(todoGet)],
  }
}

export const TodoRoutes = createTodoRoutes()
