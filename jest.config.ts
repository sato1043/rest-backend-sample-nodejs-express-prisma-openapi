import * as fs from 'fs'

import type { JestConfigWithTsJest } from 'ts-jest'

const json5 = require('json5')
const tsConfig = json5.parse(fs.readFileSync('./tsconfig.json').toString())

//
// https://jestjs.io/ja/docs/configuration
// https://qiita.com/noriaki/items/5d800ea1813c465a0a11
// https://blog.koh.dev/2022-07-02-jest-speedup/
//
const jestConfig: JestConfigWithTsJest = {
  preset: 'jest-puppeteer',

  roots: ['<rootDir>'],
  testRegex: '^.+\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  modulePaths: [(tsConfig.compilerOptions as any).baseUrl],
  moduleNameMapper: {
    'prisma-factory/generated': '<rootDir>/node_modules/prisma-factory/generated',
    '\\.(jpg|jpeg|png|apng|gif|webp|svg)$': '<rootDir>/.jest/_mockFile.ts',
    '\\.(mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/.jest/_mockFile.ts',
    '\\.(eot|otf|ttf|woff|woff2)$': '<rootDir>/.jest/_mockFile.ts',
  },

  maxWorkers: 4,

  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/.jest/setupFilesAfterEnv.ts'],

  clearMocks: true,

  passWithNoTests: true,
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts'],
}

export default jestConfig
