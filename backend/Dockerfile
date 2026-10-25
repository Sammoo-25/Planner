FROM node:24.22.1-alpine3.24 AS base
WORKDIR /app
COPY package.json package-lock.json ./

# Test image: all deps incl. jest. Run via `docker compose --profile test run --rm backend-test`.
FROM base AS test
ENV NODE_ENV=test
RUN npm ci && npm cache clean --force
COPY --chown=node:node . .
USER node
CMD ["npm", "test"]

# Must stay the last stage: it is the default build target for `docker compose up`.
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force
# Runtime files only: keeps __tests__/ out of the production image
COPY --chown=node:node server.js db.js ./
USER node
EXPOSE 5005
CMD ["node", "server.js"]
