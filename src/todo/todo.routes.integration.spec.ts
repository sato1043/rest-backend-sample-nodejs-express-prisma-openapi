import { Todo as PrismaClient_Todo } from '@prisma/client'
import { Express } from 'express'
import pick from 'lodash.pick'
import request from 'supertest'

import { paths } from 'types/openapi.schema'

import { TodoFactory } from '../../prisma/factories/todo.factory'
import { setupOpenAPIRuntime } from '../app'

const basePath = '/api/v1'
const fakeXApiKey = process.env.FAKE_X_API_KEY || ''

type ReqBodyType = paths['/todos']['post']['requestBody']['content']['application/json']

describe(`TodoRoutes.integration`, () => {
  let app: Express

  beforeAll(async () => {
    app = await setupOpenAPIRuntime()
  })

  describe('クエリ準備', () => {
    it('X-API-KEY未指定は拒否される', async () => {
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      const response = await request(app)
        .post(`${basePath}/todos`)
        // .set('X-API-KEY', fakeXApiKey)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send(data)
      expect(response.statusCode).toBe(401)
    })
    it('RequestBodyJSON以外は拒否される', async () => {
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      const response = await request(app)
        .post(`${basePath}/todos`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'text/plain')
        .set('X-API-KEY', fakeXApiKey)
        .send(JSON.stringify(data))
      expect(response.statusCode).toBe(500)
    })
    it('RequestBody未送信は拒否される', async () => {
      const response = await request(app)
        .post(`${basePath}/todos`)
        .set('X-API-KEY', fakeXApiKey)
        .set('Accept', 'application/json')
      // .set('Content-Type', 'application/json')
      // .send(data)
      expect(response.statusCode).toBe(400)
    })
  })

  describe('パラメータ確認', () => {
    describe('パラメータ不足は拒否される', () => {
      it('パラメータ不足; name', async () => {
        // @ts-ignore
        const data: ReqBodyType = pick(TodoFactory.getValue(), [/* 'name',*/ 'email'])
        const response = await request(app)
          .post(`${basePath}/todos`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-API-KEY', fakeXApiKey)
          .send(data)
        expect(response.statusCode).toBe(400)
      })
      it('パラメータ不足; email', async () => {
        // @ts-ignore
        const data: ReqBodyType = pick(TodoFactory.getValue(), ['name' /*, 'email'*/])
        const response = await request(app)
          .post(`${basePath}/todos`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-API-KEY', fakeXApiKey)
          .send(data)
        expect(response.statusCode).toBe(400)
      })
    })
    describe('パラメータ重複は拒否される', () => {
      let todo: PrismaClient_Todo
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      beforeEach(async () => {
        todo = await TodoFactory.create()
      })
      it(`パラメータ重複; name`, async () => {
        const response = await request(app)
          .post(`${basePath}/todos`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-API-KEY', fakeXApiKey)
          .send({ ...data, name: todo.name })
        expect(response.statusCode).toBe(409)
      })
      it(`パラメータ重複; email`, async () => {
        const response = await request(app)
          .post(`${basePath}/todos`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-API-KEY', fakeXApiKey)
          .send({ ...data, email: todo.email })
        expect(response.statusCode).toBe(409)
      })
    })
  })

  describe('クエリ実行', () => {
    it(`TODOを１件作成できる`, async () => {
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      const response = await request(app)
        .post(`${basePath}/todos`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-API-KEY', fakeXApiKey)
        .send(data)
      expect(response.statusCode).toBe(201)
    })
    it(`TODOを同じデータでは２件作成できない`, async () => {
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      //
      const response1 = await request(app)
        .post(`${basePath}/todos`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-API-KEY', fakeXApiKey)
        .send(data)
      const response2 = await request(app)
        .post(`${basePath}/todos`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-API-KEY', fakeXApiKey)
        .send(data)
      //
      expect(response1.statusCode).toBe(201)
      expect(response2.statusCode).toBe(409)
    })
  })
})
