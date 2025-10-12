import { performance } from 'perf_hooks'
import * as process from 'process'
import util from 'util'

import { PrismaClient } from '@prisma/client'

// ==========

const production = {}

// ==========

const development = {}

// ==========

const test = {}

// ==========

// ***
// belows are mandatory variables
// ***
// prettier-ignore
if (
  !process.env.RDB1_URL ||
  !process.env.APP1_API_KEY_PASSPHRASE ||
  !process.env.APP1_API_KEY_SALT
) {
  throw new Error('miss configured')
}

// ==========

export function createPrismaClient() {
  if (process.env.PRISMA_QUERY_LOG !== 'true') {
    return new PrismaClient()
  }

  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = performance.now()
          const result = await query(args)
          const end = performance.now()
          const time = end - start
          console.log(
            util.inspect(
              { model, operation, args, time },
              { showHidden: false, depth: null, colors: true },
            ),
          )
          return result
        },
      },
    },
  })
}

// ==========

export const NODE_ENV = {
  production: 'production',
  development: 'development',
  test: 'test',
} as const

export type NodeEnvType = (typeof NODE_ENV)[keyof typeof NODE_ENV]
export const isProduction = process.env.NODE_ENV === NODE_ENV.production
export const isDevelopment = process.env.NODE_ENV === NODE_ENV.development
export const isTest = process.env.NODE_ENV === NODE_ENV.test

// ==========

export const LOG_FORMAT = {
  combined: 'combined',
  common: 'common',
  dev: 'dev',
  short: 'short',
  tiny: 'tiny',
} as const

export type LogFormatType = (typeof LOG_FORMAT)[keyof typeof LOG_FORMAT]

// ==========

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectEnv = (production: any, development: any, test: any) =>
  process.env.NODE_ENV === NODE_ENV.production ? production
    : process.env.NODE_ENV === NODE_ENV.test ? test
      : development

type Config = {
  env: NodeEnvType
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  logFormat: LogFormatType
  prisma: ReturnType<typeof createPrismaClient>
  db: {
    url: string
  }
  app: {
    apiDoc: string
    port: number
    apiKeyPassPhrase: string
    apiKeySalt: string
    healthCheckEndPointPath: string
    gracefulShutdownTimeoutSec: number
    listenOnHttps: boolean
  }
} & (typeof production | typeof development | typeof test)

const config: Config = {
  env: selectEnv(NODE_ENV.production, NODE_ENV.development, NODE_ENV.test),
  isProduction,
  isDevelopment,
  isTest,

  logFormat: selectEnv(LOG_FORMAT.combined, LOG_FORMAT.dev, LOG_FORMAT.short),

  prisma: createPrismaClient(),
  db: {
    url: process.env.RDB1_URL,
  },
  app: {
    apiDoc: 'openapi/openapi.bundled.yaml',
    port: Number(process.env.APP1_PORT || 3000),
    apiKeyPassPhrase: process.env.APP1_API_KEY_PASSPHRASE,
    apiKeySalt: process.env.APP1_API_KEY_SALT,
    healthCheckEndPointPath: process.env.HEALTHCHECK_ENDPOINT_PATH || '/health',
    gracefulShutdownTimeoutSec: Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT_SEC || 10),
    listenOnHttps: process.env.LISTEN_ON_HTTPS === 'true',
  },
  ...selectEnv(production, development, test),
}

export default config

Error.stackTraceLimit = Number(process.env.ERROR_STACK_LEN || 4)
