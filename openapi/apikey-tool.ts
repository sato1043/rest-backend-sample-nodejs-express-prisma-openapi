/**
 * 文字列暗号化(-e)/復号化(-d)
 *
 * APIキー発行；
 * > npx dotenv -- npx ts-node openapi/apikey-tool.ts -p abc -s def -e
 *   - 一度発行したAPIキーは二度発行できません
 *   - 発行された code のほうを .api-keys.json に記録します（自動で追記されます）
 *   - APIキーのほうは相手に伝え、自前では破棄して保持しません
 *   - 今のところ、新しい APIキーを使うためには再起動が必要です
 *
 * APIキー解読；
 * > npx dotenv -- npx ts-node openapi/apikey-tool.ts -p abc -s def -d <暗号化文字列>
 *   - 通常運用でAPIキーを手元で解読する必要はありません
 */
import fs from 'fs'
import path from 'path'
import getopts from 'getopts'
import * as uuid from 'uuid'
const options = getopts(process.argv.slice(2))

import { decrypt, encrypt } from '../src/util/crypto.util'

const passphrase = options['p'] || process.env.APP1_API_KEY_PASSPHRASE || uuid.v4()
const salt = options['s'] || process.env.APP1_API_KEY_SALT || uuid.v4()
if (!passphrase || !salt) {
  console.error(`error: empty passphrase or salt`)
  process.exit(2)
}

const apiKeysFilePath = path.resolve(process.cwd(), 'src', '.api-keys.json')

if (options['e']) {
  // generate a unique code and its apiKey
  let code = uuid.v4() || options['e']

  // read existing codes (array of strings)
  let codes: string[] = []
  try {
    if (fs.existsSync(apiKeysFilePath)) {
      const txt = fs.readFileSync(apiKeysFilePath, 'utf-8').trim()
      if (txt) {
        const parsed = JSON.parse(txt)
        if (Array.isArray(parsed)) {
          codes = parsed
        }
      }
    } else {
      // ensure directory exists; src/ should already exist but be defensive
      fs.mkdirSync(path.dirname(apiKeysFilePath), { recursive: true })
    }
  } catch (e) {
    console.error(`error: failed to read ${apiKeysFilePath}:`, e)
    process.exit(3)
  }

  // ensure uniqueness just in case
  let attempts = 0
  while (codes.includes(code) && attempts < 5) {
    code = uuid.v4()
    attempts++
  }
  if (codes.includes(code)) {
    console.error('error: could not generate unique code after several attempts')
    process.exit(4)
  }

  // append and write back prettified
  codes.push(code)
  try {
    fs.writeFileSync(apiKeysFilePath, JSON.stringify(codes, null, 2) + '\n', 'utf-8')
  } catch (e) {
    console.error(`error: failed to write ${apiKeysFilePath}:`, e)
    process.exit(5)
  }

  // output info to stdout as before
  console.log(
    JSON.stringify(
      {
        passphrase,
        salt,
        code,
        apiKey: encrypt(passphrase, salt, code),
      },
      null,
      2,
    ),
  )
} else if (options['d']) {
  console.log(decrypt(passphrase, salt, options['d']))
} else {
  console.error('error: no method specified: (use -d or -e)')
}
