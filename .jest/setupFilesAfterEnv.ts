import { Prisma } from '@prisma/client'

/**
 * @see https://jestjs.io/docs/configuration#setupfilesafterenv-array
 * > A list of paths to modules that run some code to configure or set up
 * > the testing framework before each test file in the suite is executed.
 * > Since setupFiles executes before the test framework is installed in the
 * > environment, this script file presents you the opportunity of running
 * > some code immediately after the test framework has been installed in
 * > the environment but before the test code itself.
 * >
 * > In other words, setupFilesAfterEnv modules are meant for code
 * > which is repeating in each test file. Having the test framework installed makes
 * > Jest globals, jest object and expect accessible in the modules. For example,
 * > you can add extra matchers from jest-extended library or call setup and teardown hooks:
 */

/**
 * Jest再入門 - 関数・モジュールモック編
 * https://developer.mamezou-tech.com/testing/jest/jest-mock/
 */

import { faker } from '@faker-js/faker'

// stick timezone
process.env.TZ ??= 'Asia/Tokyo'

// stick faker seed
const fakeSeed = faker.seed(process.env.FAKE_SEED ? Number(process.env.FAKE_SEED) : undefined)

// overwrite connection string fixing to jest worker number
if (!process.env.RDB1_URL || !process.env.JEST_WORKER_ID) {
  throw new Error(`miss configured`)
}
process.env.RDB1_URL = `${process.env.RDB1_URL}--${process.env.JEST_WORKER_ID}`

// summarize environment
/*
console.info({
  NODE_ENV: process.env.NODE_ENV,
  TZ: process.env.TZ,
  FAKE_SEED: fakeSeed,
  JEST_WORKER_ID: process.env.JEST_WORKER_ID,
  RDB1_URL: process.env.RDB1_URL,
})
*/

// cache configurations
//  - and connect database in PrismaClient
// noinspection ES6UnusedImports
import $c from '../src/config'

// mock global Date object
import 'jest-date-mock'

async function truncateAll() {
  await $c.prisma.$queryRaw`SET FOREIGN_KEY_CHECKS=0`
  for (const modelName of Prisma.dmmf.datamodel.models.map((model) => model.dbName)) {
    await $c.prisma.$queryRawUnsafe(`TRUNCATE TABLE ${modelName}`)
  }
  await $c.prisma.$queryRaw`SET FOREIGN_KEY_CHECKS=1`
}

// IMPORTANT:
//   because of all truncating on **each** test,
//   all inserted records at beforeAll will be lost.
afterEach(async () => {
  await truncateAll()
})
