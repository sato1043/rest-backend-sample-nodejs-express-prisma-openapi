# syntax=docker/dockerfile:1.3-labs
##########################################################

### build args
ARG AWS_ACCOUNT_ID
ARG AWS_REGION

#### ビルドステージ
FROM ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/node:16-alpine3.15 as builder

WORKDIR /app

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini

ENV WAIT_FOR_VERSION 4df3f9262d84cab0039c07bf861045fbb3c20ab7
ADD https://raw.githubusercontent.com/eficode/wait-for/$WAIT_FOR_VERSION/wait-for /wait-for
RUN chmod +x /wait-for

ENV HADOLINT_VERSION v2.12.0
ADD https://github.com/hadolint/hadolint/releases/download/$HADOLINT_VERSION/hadolint-Linux-x86_64 /hadolint
RUN chmod +x /hadolint

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY redocly.yaml ./
COPY openapi ./openapi
RUN npx redocly bundle -o openapi/openapi.bundled.yaml

COPY ./prisma/*.prisma ./prisma/
RUN npx prisma generate --generator client

COPY tsconfig.json tsconfig.release.json ./
COPY src ./src
RUN mkdir dist && npx tsc -p tsconfig.release.json

##########################################################
#### ビルドステージ(2)
FROM ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/node:16-alpine3.15 as builder-prod

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --prod --frozen-lockfile

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

##########################################################
#### 実行イメージ
FROM ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/node:16-alpine3.15
RUN <<EOL
  # https://www.docker.com/blog/introduction-to-heredocs-in-dockerfiles/
  apk update
  apk add --no-cache mysql-client curl jq
  # https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-on-alpine
  apk add --no-cache nss freetype harfbuzz ca-certificates ttf-freefont chromium
  npm i -g npm
  addgroup nonroot && adduser -G nonroot -D nonroot
  mkdir -p /home/nonroot/Downloads
  chown -R nonroot:nonroot /home/nonroot/Downloads
EOL

USER nonroot

ENV NODE_ENV development

ENV APP1_HOST ${APP1_HOST:-}
ENV APP1_PORT ${APP1_PORT:-}
ENV APP1_API_KEY_PASSPHRASE ${APP1_API_KEY_PASSPHRASE:-}
ENV APP1_API_KEY_SALT ${APP1_API_KEY_SALT:-}

# within ECS task definition, set its value
# or locally docker run -e RDB1_URL ...
#ARG RDB1_URL # also with --build-arg when debug
ENV RDB1_URL ${RDB1_URL:-}
ENV RDB1_HOST ${RDB1_HOST:-}
ENV RDB1_PORT ${RDB1_PORT:-}
ENV RDB1_DB_NAME ${RDB1_DB_NAME:-}
ENV RDB1_PRISMA_SHADOW_DB_URL ${RDB1_PRISMA_SHADOW_DB_URL:-}

ENV HEALTHCHECK_ENDPOINT_PATH ${HEALTHCHECK_ENDPOINT_PATH:-}
ENV GRACEFUL_SHUTDOWN_TIMEOUT_SEC ${GRACEFUL_SHUTDOWN_TIMEOUT_SEC:-}

ENV SAAS_DOMAIN ${SAAS_DOMAIN:-}

ENV FAKE_SEED ${FAKE_SEED:-}
ENV PRISMA_QUERY_LOG ${PRISMA_QUERY_LOG:-}
ENV ERROR_STACK_LEN ${ERROR_STACK_LEN:-}
ENV LISTEN_ON_HTTPS=${LISTEN_ON_HTTPS:-}

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /tini /tini
COPY --from=builder --chown=nonroot:nonroot /wait-for /wait-for
COPY --from=builder --chown=nonroot:nonroot /hadolint /usr/local/bin/hadolint

# node_modules は開発・リリースでビルドステージを切り替えます
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
#COPY --from=builder-prod --chown=nonroot:nonroot /app/node_modules ./node_modules

# dist は常にコンテナ内のボリュームを利用して、ローカルをマウントしない
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist

# OpenAPI定義はexpressサーバー生成に使用（設定は開発時のみ使用
COPY --from=builder --chown=nonroot:nonroot /app/openapi/openapi.bundled.yaml ./openapi/
COPY --from=builder --chown=nonroot:nonroot /app/redocly.yaml ./

# Dockerfile はコンテナ内で hadolint 等するためだけにコピー（つまりコンテナ内でコンテナビルド等ありません
COPY --chown=nonroot:nonroot Dockerfile ./

# ソースコードは、更新閑散な設定系はコピー、頻繁な TSと Prisma だけはローカルファイルをマウント
# とはいえ.env はシークレットが書かれることもあるだろうからコピーせずマウントする
COPY --chown=nonroot:nonroot package.json yarn.lock  ./
COPY --chown=nonroot:nonroot tsconfig.json tsconfig.release.json tsconfig.ts-node.json ./
COPY --chown=nonroot:nonroot .prettierignore .prettierrc .eslintrc ./
COPY --chown=nonroot:nonroot jest.config.ts .jest-puppeteerrc .docker-compose/dev-app/test-prepare-dbs.sh ./
COPY --chown=nonroot:nonroot .jest ./.jest
COPY --chown=nonroot:nonroot .ssl ./.ssl
RUN mkdir -p ./prisma ./openapi ./src ./coverage
VOLUME /app/prisma
VOLUME /app/openapi
VOLUME /app/src
VOLUME /app/coverage

EXPOSE 3000
EXPOSE 9229

COPY --chown=nonroot:nonroot .docker-compose/dev-app/debug.sh ./
ENTRYPOINT [ "sh", "-c", "echo waiting... && /wait-for ${RDB1_HOST}:${RDB1_PORT} -- /app/debug.sh" ]
#ENTRYPOINT [ "sh", "-c", "echo waiting... && /wait-for ${RDB1_HOST}:${RDB1_PORT} -- /tini -- node /app/dist/index.js" ]
