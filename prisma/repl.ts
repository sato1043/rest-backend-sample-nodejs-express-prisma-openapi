import * as tsNode from 'ts-node'

const repl = tsNode.createRepl()
repl.setService(tsNode.create())
repl.start()
repl.evalCode(`
import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'js-yaml'
import { Prisma, PrismaClient } from '@prisma/client'
import $f from './prisma/factories'
import $c from './src/config'

import { faker } from '@faker-js/faker'
const fakeSeed = faker.seed(process.env.FAKE_SEED ? Number(process.env.FAKE_SEED) : undefined)

// stick timezone
process.env.TZ ??= 'Asia/Tokyo'

async function truncateAll() {
  await $c.prisma.$queryRaw\`SET FOREIGN_KEY_CHECKS=0\`
  for (const modelName of Prisma.dmmf.datamodel.models.map((model) => model.dbName)) {
    await $c.prisma.$queryRawUnsafe(\`TRUNCATE TABLE \${modelName}\`)
  }
  await $c.prisma.$queryRaw\`SET FOREIGN_KEY_CHECKS=1\`
}

console.log(\`
usage:
  > await $c.prisma.$queryRaw\\\`show databases\\\`
     :

  > await $f.TodoFactory.create()
     :

  > await $c.prisma.todo.findMany()
     :

  > await truncateAll()
     :
\`)
console.log('(type enter...)')
`)
