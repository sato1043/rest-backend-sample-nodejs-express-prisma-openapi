/**
 * @jest-environment puppeteer
 */

import pick from 'lodash.pick'

import { paths } from 'types/openapi.schema'

import { TodoFactory } from '../../prisma/factories/todo.factory'
import $c from '../config'

const APP1_HOST = process.env.APP1_HOST || ''
const APP1_PORT = process.env.APP1_PORT || ''
const proto = process.env.LISTEN_ON_HTTPS ? 'https' : 'http'
const baseUrl = `${proto}://${APP1_HOST}:${APP1_PORT}/api/v1`
const fakeXApiKey = process.env.FAKE_X_API_KEY || ''

type ReqBodyType = paths['/todos']['post']['requestBody']['content']['application/json']
type ResBodyType = paths['/todos']['post']['responses']['201']['content']['application/json']

describe(`TodoRoutes.e2e`, () => {
  const RDB1_URL_BK = process.env.RDB1_URL
  beforeAll(async () => {
    // 前提として、process.env はテストワーカー環境作成時点でワーカー専用に複製されている
    process.env.RDB1_URL = $c.db.url.replaceAll(`--${process.env.JEST_WORKER_ID}`, '')
    // console.log({
    //   '$c.db.url': $c.db.url,
    //   RDB1_URL: process.env.RDB1_URL,
    //   RDB1_URL_BK: RDB1_URL_BK,
    //   datasource: await queryCurrentDatabase($c.prisma),
    // })
  })
  afterAll(async () => {
    process.env.RDB1_URL = RDB1_URL_BK
  })

  describe('クエリ実行', () => {
    it(`ブラウザからTODOを１件作成できる`, async () => {
      const data: ReqBodyType = pick(TodoFactory.getValue(), ['name', 'email', 'text'])
      const response = await page.evaluate(
        async (baseUrl, fakeXApiKey, data) => {
          const response = await fetch(`${baseUrl}/todos`, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-API-KEY': fakeXApiKey,
            },
            method: 'POST',
            body: JSON.stringify(data),
          })
          return {
            url: response.url,
            statusCode: response.status,
            json: await response.json(),
          }
        },
        baseUrl,
        fakeXApiKey,
        data,
      )
      expect(response.statusCode).toBe(201)
      const { todoId }: ResBodyType = response.json
      await $c.prisma.todo.delete({ where: { todoId } }) // wipe
    })
  })
})
