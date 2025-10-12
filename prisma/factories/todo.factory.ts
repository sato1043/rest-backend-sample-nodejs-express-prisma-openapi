import { Prisma, Todo as PrismaClient_Todo } from '@prisma/client'
import { createTodoFactory } from 'prisma-factory/generated'
import { faker } from '@faker-js/faker'
import { CreateFactoryReturn } from 'prisma-factory'

type TodoFactoryType = CreateFactoryReturn<Prisma.TodoCreateInput, PrismaClient_Todo> & {
  getValue: () => PrismaClient_Todo
}

/**
 * TodoFactoryは PrismaClient直結のDAO。テストフィクスチャファクトリー
 */
export const TodoFactory: TodoFactoryType = {
  ...createTodoFactory({
    name: () => faker.company.name(),
    email: () => faker.internet.email(),
    text: () => faker.lorem.text(),
  }),
  getValue: (): PrismaClient_Todo => ({
    createdAt: new Date(),
    updatedAt: new Date(),
    todoId: faker.datatype.number(),
    name: faker.company.name(),
    email: faker.internet.email(),
    text: faker.lorem.text(),
  }),
}
