import fs from 'fs'
import path from 'path'
import util from 'util'

import { createTerminus } from '@godaddy/terminus'
import { ErrorObject } from 'ajv'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { RequestHandler } from 'express'
import listEndpoints from 'express-list-endpoints'
import { ExpressOpenAPIArgs, initialize } from 'express-openapi'
import helmet from 'helmet'
import * as YAML from 'js-yaml'
import pick from 'lodash.pick'
import logger from 'morgan'
import OpenAPIFramework from 'openapi-framework'
import OpenAPIResponseValidator, { OpenAPIResponseValidatorError } from 'openapi-response-validator'
import { SecurityHandler } from 'openapi-security-handler'
import { OpenAPIV3 } from 'openapi-types'

import apiKeys from './.api-keys.json'
import $c from './config'
import { TodoRoutes } from './todo/todo.routes'
import { decrypt } from './util/crypto.util'

export async function setupOpenAPIRuntime() {
  //
  // first, getting express instance
  //
  const app = express()

  app.disable('x-powered-by')
  app.use(logger($c.logFormat))
  app.use(helmet())
  app.use(cors())
  app.use(compression())
  app.use(cookieParser())

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  const notFound: RequestHandler = (req, res) => {
    res.status(404).send()
  }
  app.get('/', notFound)
  app.get('/api', notFound)
  app.get('/api/v1', notFound)

  //
  // then openapi matters
  //

  // openapi-request-validator#args.errorTransformer
  const errorTransformer: ExpressOpenAPIArgs['errorTransformer'] = (arg1, arg2) => {
    const responseValidationError = arg1 as OpenAPIResponseValidatorError
    const ajvError = arg2 as ErrorObject
    if ($c.isDevelopment) {
      console.error(
        util.inspect(
          {
            responseValidationError,
            ajvError,
          },
          { showHidden: false, depth: null, colors: true },
        ),
      )
    }
    const returnedError: OpenAPIResponseValidatorError & {
      instancePath: typeof ajvError.instancePath
      params: typeof ajvError.params
    } = { instancePath: '', params: {}, ...responseValidationError }
    if (ajvError && ajvError) {
      if (ajvError.instancePath) {
        returnedError.instancePath = ajvError.instancePath
      }
      if (ajvError.params) {
        returnedError.params = ajvError.params
      }
    }
    return returnedError
  }

  const errorMiddleware: ExpressOpenAPIArgs['errorMiddleware'] = (err, req, res, _next) => {
    console.error(
      util.inspect(
        {
          req: `${req.method} ${req.url}`,
          headers: req.headers,
          query: req.query,
          body: req.body,
          err,
        },
        { showHidden: false, depth: null, colors: true },
      ),
    )
    if (err?.status === 401) {
      // TODO refresh jwt
      res.status(err.status).json({
        title: 'Request Unauthorized',
        status: err.status,
        detail: err?.errors?.[0]?.message,
      })
      return
    } else if (
      err?.status === 400 ||
      err?.status === 401 ||
      err?.status === 409 ||
      err?.status === 422
    ) {
      res.status(err.status).json({
        title: err.message || 'Invalid Parameters supplied',
        status: err.status,
        detail: err?.errors?.[0]?.message,
      })
      return
    } else {
      res.status(500).json({
        title: 'Internal Server Error',
        status: 500,
        detail: err?.errors?.[0]?.message,
      })
    }
  }

  const validateAllResponses: RequestHandler = (req, res, next) => {
    const validator = res as unknown as OpenAPIResponseValidator
    if (typeof validator.validateResponse !== 'function') {
      next()
      return
    }
    const framework = req as unknown as OpenAPIFramework
    const apiDoc = framework.apiDoc as OpenAPIV3.Document
    const onlyWarn = !apiDoc['x-express-openapi-validation-strict']
    const json = res.json
    res.json = function expressOpenAPISend(...args) {
      if (res.get('x-express-openapi-validation-error-for') !== undefined) {
        return json.apply(res, args)
      }
      const body = args[0]
      const validation = validator.validateResponse(res.statusCode, body)
      if (validation?.errors) {
        console.error(
          util.inspect(
            {
              req: `${req.method} ${req.url}`,
              headers: req.headers,
              query: req.query,
              body: req.body,
              responseBody: body,
              validation,
            },
            { showHidden: false, depth: null, colors: true },
          ),
        )
        // Set to avoid a loop, and to provide the original status code
        res.set('x-express-openapi-validation-error-for', res.statusCode.toString())
      }
      if (onlyWarn || !validation?.errors) {
        return json.apply(res, args)
      } else {
        res.status(500)
        return res.json({
          title: 'Invalid Response Provided',
          status: 500,
        })
      }
    }
    next()
  }

  const validateApiKey: SecurityHandler = (req, scopes) => {
    try {
      if (!req.headers || !('x-api-key' in req.headers)) return false
      const apiKey = req.headers['x-api-key'] as string
      const code = decrypt($c.app.apiKeyPassPhrase, $c.app.apiKeySalt, apiKey)
      return apiKeys.includes(code)
    } catch (e) {
      return false
    }
  }

  const validateOauth: SecurityHandler = (req, scopes) => {
    return Promise.resolve(true)
  }

  const validateBearer: SecurityHandler = (req, scopes) => {
    return Promise.resolve(true)
  }

  const validateBasicAuth: SecurityHandler = (req, scopes) => {
    return Promise.resolve(true)
  }

  const apiDocText = await fs.promises.readFile(path.join(__dirname, '..', $c.app.apiDoc))
  const apiDoc = YAML.load(apiDocText.toString()) as OpenAPIV3.Document
  // https://github.com/kogosoftwarellc/open-api/tree/master/packages/express-openapi/test/sample-projects
  const openAPIFramework = await initialize({
    app,
    apiDoc: {
      ...apiDoc,
      'x-express-openapi-additional-middleware': [validateAllResponses],
      'x-express-openapi-validation-strict': true,
    },
    validateApiDoc: false, // OpenAPIスキーマ定義のバリデーションは redocly bundle を基準にします
    exposeApiDocs: false,
    promiseMode: true,
    consumesMiddleware: {
      'application/json': express.json(),
      'application/problem-json': express.json(),
    },
    errorTransformer,
    errorMiddleware,
    securityHandlers: {
      api_key: validateApiKey,
      // oauth: validateOauth,
      // bearer: validateBearer,
      // basic_auth: validateBasicAuth,
    },
    operations: {
      ...TodoRoutes,
    },
  })

  if ($c.isDevelopment) {
    // console.log(`=== OpenAPIFramework summary ====`)
    // console.log(openAPIFramework)
    console.log(`=== express summary ====`)
    console.log(`bellow routes are available;`)
    console.log(
      util.inspect(
        listEndpoints(app).map((o) => pick(o, 'methods', 'path')),
        { showHidden: false, depth: null, colors: true },
      ),
    )
  }

  return app
}

export function setupTerminus<T>(server: T, onShutdown: () => Promise<void>) {
  createTerminus(
    server,
    Object.freeze({
      logger: console.info,
      healthChecks: { [$c.app.healthCheckEndPointPath]: async () => 'UP' },
      signals: ['SIGTERM', 'SIGINT', 'SIGHUP'],
      timeout: $c.app.gracefulShutdownTimeoutSec * 1000,
      onShutdown,
    }),
  )
  return server
}
