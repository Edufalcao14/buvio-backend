# Buvio — backend

Buvio is the third half — _la troisième mi-temps_ — made into an app: an
amateur football squad plays a match, then gathers to crown its **Top** and
roast its **Flop**.

This service is the whole backend: a single GraphQL API (queries, mutations and
one subscription) over Postgres, consumed by the `Buvio-mobile` Expo app. There
is no REST surface — third parties are not a use case.

Read [CONTEXT.md](CONTEXT.md) first. It defines the domain language (Team,
Match, Voting Session, Ballot, Tally, Verdict, Closure Reason, ...) and the
rules that shape it; the code uses those words literally, and a name that
drifts from that list is a bug.

Decisions that are not obvious from the code live in [docs/adr](docs/adr):

- [0001](docs/adr/0001-voting-session-closure-is-stored-not-derived.md) — closure is stored, not derived
- [0002](docs/adr/0002-realtime-over-graphql-subscriptions.md) — realtime over GraphQL subscriptions
- [0003](docs/adr/0003-images-upload-directly-to-r2.md) — images upload directly to R2

## Table of Contents

- [Getting started](#getting-started)
- [Folder structure](#folder-structure)
- [Context object](#context-object)
- [Realtime and the sweeper](#realtime-and-the-sweeper)
- [Error handling](#error-handling)
- [Authorization](#authorization)
- [Request cost limits and rate limiting](#request-cost-limits-and-rate-limiting)
- [Testing](#testing)
- [Database migrations](#database-migrations)
- [Dependencies updates](#dependencies-updates)

## Getting started

### Prerequisites

- [Bun](https://bun.sh/docs/installation) — runs the source in development and
  the compiled output in production. `tsc` is kept only for the build and for
  typechecking, which bun does not do.
- [Docker](https://docs.docker.com/get-docker/) with Compose.
- A `.env` at the root: copy `.env.example` and fill it in. `docker compose`
  refuses to start without `POSTGRES_PASSWORD`, and the server refuses to boot
  outside development without `CORS_ORIGIN` (unset makes CORS answer every
  origin with `*`). Firebase credentials are needed to sign in at all; the R2
  ones can stay empty — only the upload mutations fail without them.

### Run it

```bash
docker compose up --build
```

This creates the local database, applies migrations and starts the server on
`PORT` (4000) with the Apollo sandbox at `/graphql` when `GRAPHQL_SANDBOX=true`.
`src` is bind-mounted and `bun --watch` reloads on change, so no restart is
needed after an edit.

The development database is published on `127.0.0.1:55432` (5432 is usually
taken by another project); override with `POSTGRES_HOST_PORT`.

To fill it with a team, players, matches and closed sessions:

```bash
bun run db:seed
```

### Commands

| Command                            | What it does                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `bun run test [path]`              | Jest — unit tests plus repository integration tests against a real Postgres                  |
| `bun run typecheck`                | `tsc --noEmit`; CI runs this and the tests                                                   |
| `bun run db:migrate:up` / `:down`  | Apply / revert migrations (needs `DATABASE_URL`)                                             |
| `bun run db:generate`              | Regenerate `src/repositories/database/models.ts` from the live schema — run migrations first |
| `bun run graphql:generate[:watch]` | Regenerate resolver types from `src/graphql/schema.graphql`                                  |
| `bun run format`                   | Prettier                                                                                     |

Husky enforces a commit message convention and a branch name of
`(feat|feature|chore|fix|hotfix|release)/...`.

### VS Code debugging

The dev server exposes the inspector on `9229` (`bun --watch --inspect`). Add
`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"],
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/usr/src/app"
    }
  ]
}
```

## Folder structure

The layering is deliberately flat: a resolver calls a usecase, a usecase calls
repositories and gateways, nothing calls back up. Anything that adds a layer to
that needs a reason.

```
src/
├── entities/        business objects, by module (match, team, user, vote, votingSession, ...)
├── usecases/        one file, one public function — the application's verbs
├── repositories/    database access, one folder per table + database/ (Kysely, migrations, models)
├── graphql/         schema.graphql, resolvers, scalars, validation rules, error plumbing
├── gateways/        external services (iam, storage) + mocks/ used by tests
└── libs/            config, context, events, logger, rate-limit, scheduler, tests
```

### entities

Plain business objects, no framework types. Some carry the rules that the
domain actually turns on and are unit-tested on their own — `ballot.ts`
(a ballot cannot name its caster, cannot name someone off the roster, cannot
give the same teammate both Top and Flop), `vote-result.ts` (a session without
votes in both categories has **no** verdict), `player-standing.ts`,
`social-name.ts` (the nickname → display-name fallback).

### usecases

One file per use case, one public function each, grouped by module. The
function reads top to bottom: authorize, validate, orchestrate. Everything a
caller is allowed to do is in this directory — `close-voting-session.ts`,
`create-vote.ts`, `join-team.ts`, `delete-account.ts` — plus `shared/`, which
holds request authentication, validation and the authorization helpers below.

### repositories

One folder per table, one file per query, each returning entities. `mappers/`
turn rows into entities, so nothing above this layer sees a database shape.

Queries are built with [Kysely](https://kysely.dev/docs/intro): type-safe,
generated from the real schema (`db:generate` writes `models.ts`), no raw SQL.
Repositories are instantiated **per request** because they wrap
[DataLoaders](https://github.com/graphql/dataloader) — the batching is what
keeps a nested GraphQL document from turning into N+1 queries.

`transactions/` holds the operations that must be atomic (closing a session,
deleting an account). `errors.ts` converts every driver failure into
`INTERNAL_ERROR` so no Postgres message escapes to a client.

### graphql

`schema.graphql` is the contract; `graphql:generate` writes the resolver types.
Resolvers work on **entities**, not generated models: that is what lets `User`
expose `team` without ever exposing `organisationId`-style plumbing. Field
resolution is explicit — every field in the schema has a resolve function, even
a one-to-one mapping — so data fetching stays visible instead of implicit.

### gateways

One folder per kind of external service, named for the service rather than the
vendor (`iam`, `storage` — not `firebase`, `r2`), with entities in and entities
out. `mocks/` mirrors them for tests. Swapping Firebase or R2 should not reach
past this directory.

## Context object

`src/libs/context` threads everything a request needs through the layers.
`config`, `logger`, `gateways` and `events` are built once at startup;
`repositories` and `auth` are per request — repositories because of the
dataloaders, `auth` because it carries who the caller is (unauthenticated,
authenticated, impersonating).

The sweeper (below) builds its own context with `auth: { isAuthenticated: false }`:
it acts as the system, and its usecase never asks who the caller is.

## Realtime and the sweeper

`votingSessionUpdated` pushes the session on every ballot and on closure, over
`graphql-ws`. The bus behind it (`src/libs/events`) is an in-process `PubSub` —
deliberately, while one process serves the app; a Redis-backed bus is the change
to make when a second appears, and nothing outside that module knows the
difference.

A deadline is the one closure nobody triggers by acting, so
`src/libs/scheduler/voting-session-sweeper.ts` polls for overdue sessions every
10s. The sweep is idempotent: whoever closes the session first wins, the rest
get `null` and stay quiet. It publishes into the same bus the WebSocket server
subscribes to — which is why both are created once in `src/index.ts`.

## Error handling

**The API never returns user-facing prose.** Every business failure is reported
as a stable, language-neutral code and the client owns the wording, per language.
The mobile app's table lives in
`Buvio-mobile/src/lib/errors/messages.ts`; add an entry there whenever a new code
is introduced here.

The codes are the enum in `src/entities/errors/error-message-code.ts`. A failed
request looks like this:

```json
{
  "errors": [
    {
      "message": "USER_NOT_IN_TEAM",
      "path": ["createMatch"],
      "extensions": {
        "code": "BAD_USER_INPUT",
        "errorCode": "USER_NOT_IN_TEAM",
        "status": 400
      }
    }
  ]
}
```

- `errorCode` is the contract: a value of `ErrorMessageCode`. Clients switch on
  this. `message` repeats it, so matching on either works.
- `code` is the coarse category (`BAD_USER_INPUT`, `UNAUTHORIZED`, `NOT_FOUND`,
  `FORBIDDEN`, `CONFLICT`, `BAD_REQUEST`, `UNKNOWN`) and `status` its HTTP
  equivalent. Useful for generic handling, not for specific messages.
- `details` is present only when the error declared it, and only ever carries
  field and constraint names — never user data. `VALIDATION_FAILED` uses it to
  say which field failed and which rule it broke:
  `{"field": "email", "rule": "string.email"}`.

Rules when adding or changing errors:

- Throw one of the classes in `src/entities/errors/`, constructed with an
  `ErrorMessageCode`. Never construct an error with a free-text message.
- Never reuse or repurpose an existing code; add a new one. Clients pin to them.
- Never put user data in `details` — it is returned to the caller and logged.
- Two codes must never be distinguishable only by whether a record exists. That
  is how an endpoint becomes an enumeration oracle; `requireVotingSessionInTeam`
  in `src/usecases/shared/authorization.ts` deliberately reports "belongs to
  another team" and "does not exist" identically.
- Repositories must not surface driver messages. `toDatabaseError` in
  `src/repositories/database/errors.ts` converts any driver failure into
  `INTERNAL_ERROR`, keeping the operation name and stack for the logs only.

Everything the response omits — the operation, the stack, the driver text — is
written by `src/graphql/errors/error-logging-plugin.ts`.

## Authorization

Authorization lives in the usecases, not only at the entry points, so a new or
mistaken resolver cannot expose records by id. `src/usecases/shared/authorization.ts`
is the single place that resolves the caller and the tenant boundary:

- `requireActiveUser(ctx)` — authenticated, exists, and not soft-deleted. Use it
  instead of reading `ctx.auth.externalId` directly.
- `requireTeamMember(ctx)` — the above plus a team; the returned `teamId` is the
  boundary every team-scoped read and write must filter on.
- `requireMatchInTeam(ctx, matchId, teamId)` and
  `requireVotingSessionInTeam(ctx, votingSessionId, teamId)` — load the record
  and assert it belongs to that team.

## Request cost limits and rate limiting

The schema is cyclic (`User.team -> Team.creator -> User.team ...`), so an
unbounded document can amplify into thousands of resolver calls. Two validation
rules run before any resolver does (`src/graphql/validation/`):
`GRAPHQL_MAX_DEPTH` bounds nesting and `GRAPHQL_MAX_FIELDS` bounds total
selections. Both report `QUERY_TOO_COMPLEX`.

`src/libs/rate-limit/` puts a per-IP fixed window in front of `/graphql`
(`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`). It is in-memory, so the budget is
**per process**: with N instances the effective limit is N x `RATE_LIMIT_MAX`.
It exists to make the guessable surfaces expensive — 5-character team codes,
`isEmailTaken`, sign-in — so move it to a shared store before scaling out.

Introspection, the Apollo sandbox and stack traces are controlled by
`GRAPHQL_SANDBOX`, and are force-disabled whenever `NODE_ENV=production`.

## Testing

Repository tests are integration tests against a real Postgres: they assert SQL,
constraints, transaction behaviour and dataloader batching, none of which a mock
can tell you anything about. Entity rules (ballot validity, verdict, standings)
are unit-tested next to the entity.

`jest.config.ts` starts **one** container for the whole run
(`src/libs/tests/setup/before-all.ts`) and migrates it once. Suites therefore
share a database and isolate themselves with `helpers.resetDatabase`, which is
why `maxWorkers` is 1.

Inside a suite:

- `tests.setup()` opens a pool and returns `repositories`, `freshRepositories()`,
  a `context(auth)` builder and `onStop`.
- Use `freshRepositories()` whenever a test must observe a write made through a
  different repository instance: dataloaders are request-scoped caches, so a
  reused instance can legitimately answer from cache.
- `tests.helpers` inserts fixtures that already satisfy the foreign keys
  (`insertUserWithTeam`, `insertMatch`, `insertVotingSession`, ...).

## Database migrations

Migrations are Kysely scripts in `src/repositories/database/migrations`, named
`YYYY_MM_DD_HHMMSS_description.ts` so they order chronologically. Every file
exports `up` and `down`; the `down` must actually revert, or a bad deploy has no
way back.

After changing the schema, run `db:migrate:up` then `db:generate` — `models.ts`
is generated from the live database, and a stale one makes Kysely lie about the
columns that exist.

## Dependencies updates

[Renovate](https://docs.renovatebot.com/) opens the update PRs; its config is
[renovate.json](renovate.json). CI (typecheck + tests) is the gate.

`package.json` carries an `overrides` block pinning patched transitive versions
(`jose`, `cookie`, `braces`) and a `_dependencyNotes` field explaining why each
one is there — notably that the `jose` override is scoped to `jwks-rsa` on
purpose, because a global one breaks graphql-codegen. Re-check those notes on
every upgrade.
