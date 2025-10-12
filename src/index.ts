import fs from 'fs'
import http from 'http'
import https from 'https'
import process from 'process'

import { setupOpenAPIRuntime, setupTerminus } from './app'
import $c from './config'

async function listenOnHttpServer() {
  const requestListener = await setupOpenAPIRuntime()
  const httpServer = $c.app.listenOnHttps
    ? https.createServer(
        {
          key: fs.readFileSync('.ssl/localhost.key', 'utf8'),
          cert: fs.readFileSync('.ssl/localhost.crt', 'utf8'),
          requestCert: false,
          rejectUnauthorized: false,
        },
        requestListener,
      )
    : http.createServer(requestListener)
  const apiServer = setupTerminus(httpServer, async function onShutdown() {
    console.info('server is starting cleanup')
    // ...
    // here my cleanup code
    // ...
    await $c.prisma.$disconnect()
    console.info('cleanup finished, shutting down')
  })

  apiServer
    .listen($c.app.port)
    .once('listening', () => {
      const proto = $c.app.listenOnHttps ? 'https' : 'http'
      console.log(`${proto} server listening on port ${$c.app.port}`)
      console.log(`LISTEN_ON_HTTPS ${process.env.LISTEN_ON_HTTPS}`)
      console.log(`NODE_ENV ${$c.env}`)
      console.log(`RDB1_URL ${$c.db.url.replaceAll(/mysql:\/\/(.+):.+@/g, 'mysql://$1:***@')}`)
    })
    .once('error', (err) => {
      console.error('Error starting the server', err)
      throw err
    })
}

listenOnHttpServer()
  .then(async () => {
    await $c.prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await $c.prisma.$disconnect()
    process.exit(1)
  })
