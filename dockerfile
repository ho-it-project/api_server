###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM node:20-alpine as development
WORKDIR /app
RUN npm install -g pnpm

######################
#BUILD FOR PRODUCTION#
######################
FROM development as build
WORKDIR /app
COPY ./ ./


ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=PRODUCTION

# Copy pnpm from development stage
COPY --from=development /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/pnpm


# Install app dependencies
RUN pnpm install --frozen-lockfile
RUN npx ts-patch install
RUN pnpm run prebuild
RUN pnpm run build
RUN mkdir -p /app/packages/api
RUN npx nestia swagger
RUN pnpm prune --prod
RUN pnpm db:pull
RUN pnpm db:generate
USER node

######################
#BUILD FOR PRODUCTION#
######################
FROM development as production



COPY --chown=node:node --from=build /app/dist /app/dist
COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/.env /app/.env
COPY --chown=node:node --from=build /app/packages /app/packages
COPY --chown=node:node --from=build /app/package.json /app/package.json
RUN mkdir -p /app/logs && chown node:node /app/logs



USER node

CMD [ "pnpm", "run", "start:prod" ]
EXPOSE 8000

