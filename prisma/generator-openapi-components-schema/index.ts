import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'js-yaml'
import { generatorHandler } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/internals'
import convert from '@openapi-contrib/json-schema-to-openapi-schema'

// @ts-ignore
import { transformDMMF } from './prisma-json-schema-generator-master/src/generator/transformDMMF'

generatorHandler({
  onManifest() {
    return {
      defaultOutput: './openapi/components/schemas',
      prettyName: 'Prisma OpenAPI Entity Schemas Generator',
    }
  },
  async onGenerate(options) {
    if (!options.generator.output) {
      throw new Error('No output was specified for OpenAPI Schema Generator')
    }
    const outputDir = parseEnvValue(options.generator.output)
    if (!fs.existsSync(outputDir)) {
      throw new Error('No output directory exists for OpenAPI Schema Generator')
    }

    try {
      const jsonSchema = transformDMMF(options.dmmf, options.generator.config)
      const oas = await convert(jsonSchema as any)

      for (const [key, value] of Object.entries((oas as any).definitions)) {
        const requiredList = [
          `required:`,
          ...Object.keys((value as any).properties).map((k) => `  - ${k}`),
          '',
        ].join('\n')
        const schema = YAML.dump(value)
        const heading = `#\n# ${key}  (generated from schema.prisma)\n#\n`
        await fs.promises.writeFile(
          path.join(outputDir, `${key}.yaml`),
          heading + schema + requiredList,
        )
      }
    } catch (e) {
      console.error('Error: unable to write files for Prisma Schema Generator')
      throw e
    }
  },
})
