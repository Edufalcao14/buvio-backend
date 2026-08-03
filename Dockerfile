# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.3.11

################################################################################
# Base stage for all subsequent stages, with Bun and working directory set up.
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /usr/src/app

################################################################################
# Dependencies stage for installing production dependencies.
# This stage is only relevant for preparing the production build.
FROM base AS deps
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --production

################################################################################
# Build stage for compiling the application.
FROM base AS build
# Install all dependencies (including dev) for the build process.
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

################################################################################
# Migration stage to run database migrations.
FROM build AS migration
CMD ["bun", "run", "db:migrate:up"]

################################################################################
# Development stage for setting up a local development environment.
FROM base AS development
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 4000
# The inspector. docker compose publishes it on 127.0.0.1 only: the protocol is
# unauthenticated, so anyone who can reach the port runs code in the process.
EXPOSE 9229
CMD ["bun", "run", "start:dev"]

################################################################################
# Final stage for running the application with minimal runtime dependencies.
FROM base AS final
ENV NODE_ENV=production
USER bun
COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/graphql/schema.graphql ./dist/graphql/schema.graphql
EXPOSE 4000
CMD ["bun", "run", "start"]
