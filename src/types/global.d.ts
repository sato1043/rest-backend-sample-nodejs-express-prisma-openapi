import { Browser, BrowserContext, Page } from 'puppeteer'

// browser, pageの型定義を追加して、globalで使用できるようにする。
declare global {
  const browser: Browser
  const context: BrowserContext
  const page: Page
  // const jestPuppeteer: JestPuppeteer
}
