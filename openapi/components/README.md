# Reusable components

- You can create the following folders here:
  - `schemas` - reusable [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject)
  - `responses` - reusable [Response Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responseObject)
  - `parameters` - reusable [Parameter Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject)
  - `examples` - reusable [Example Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)
  - `headers` - reusable [Header Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#headerObject)
  - `requestBodies` - reusable [Request Body Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#requestBodyObject)
  - `links` - reusable [Link Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#linkObject)
  - `callbacks` - reusable [Callback Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#callbackObject)
  - `securitySchemes` - reusable [Security Scheme Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#securitySchemeObject)
- Filename of files inside the folders represent component name, e.g. `Customer.yaml`

- 今回 requestBodies を用いず、schema の中におく（Prisma から生成した基本のスキーマと近い位置に定義することでメンテもれを防ぐ意図で）
