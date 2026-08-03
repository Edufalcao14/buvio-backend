# Back-end API

This project serves as a comprehensive backend solution, offering both GraphQL and RESTful API endpoints. It enables interaction with the provided services through GraphQL queries for internal front-end applications and REST endpoints for third-party integrations.

The architecture is designed to keep the codebase simple and straightforward, facilitating ease of understanding for new developers joining the project. Any additions that introduce complexity to the structure require a justified reason, ensuring the maintainability and scalability of the system.

## Table of Contents

- [Features](#features)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Start developping](#start-developping)
  - [VS Code debugging](#vs-code-debugging)
- [Folder Structure](#folder-structure)
  - [Entities](#entities)
  - [Repositories](#repositories)
  - [UseCases](#usecases)
  - [GraphQL](#graphql)
  - [REST](#rest)
  - [Gateways](#gateways)
- [Context object](#context-object)
- [Error Handling](#error-handling)
- [Authorization](#authorization)
- [Request cost limits and rate limiting](#request-cost-limits-and-rate-limiting)
- [Testing](#testing)
- [Database Migrations](#database-migrations)
- [Dependencies updates](#dependencies-uupdates)

## Features

- **Dual API Interfaces:** Supports GraphQL for flexible, powerful API interactions and RESTful endpoints for external API consumption.
- **Scalable Architecture:** Designed for ease of extension and maintenance with a focus on clean, understandable code.

## Getting started

### Prerequisites

Before you get started, make sure you have the following tools installed:

- Bun: [Bun Installation Guide](https://bun.sh/docs/installation)
- Docker: [Docker Installation Guide](https://docs.docker.com/get-docker/)
- Docker Compose: [Docker Compose Installation Guide](https://docs.docker.com/compose/install/)
- You have to put in the root folder a `.env` file with all the environment variables you need to run the project. Copy `.env.example` and fill it in: `docker compose` refuses to start without `POSTGRES_PASSWORD`, and the server refuses to boot outside development without `CORS_ORIGIN`.

### Start developping

#### Start the Application

To start the application, run:

```bash
docker compose up --build
```

The development database is published on `127.0.0.1:55432` by default (5432 is
usually taken by another project); override with `POSTGRES_HOST_PORT`.

This will initiate the Docker containers, create the local database, apply database migrations and run the application.

We are using volumes to share files (in the `src` folder) between local environment and docker container. By doing that we can watch files changes and enable hot reloading (with `bun --watch`) of the application. This means that if you are updating a file in the `src` folder, the changes will be reflected in the running application. So you won't need to restart the container after each change.

#### Run Tests

To execute the unit and integration tests, use the command:

```bash
bun run test
```

For specific tests, specify the path:

```bash
bun run test path/to/your/test/file.test.ts
```

#### Apply migrations

To apply database migrations, run:

```bash
bun run db:migrate:up
```

Make sure you have the correct `DATABASE_URL` environment variable set in `.env` file.

To revert the last migration:

```bash
bun run db:migrate:down
```

#### Generate database types

To generate TypeScript types based on your current database structure, use:

```bash
bun run db:generate
```

This will introspect your current database structure and generate TypeScript types based on it.
Ensure you've applied all migrations before generating types to reflect the latest database structure.

#### Generate graphql types

Generate TypeScript types from the GraphQL schema (`src/graphql/schema.graphql`) with:

```bash
bun run graphql:generate
```

To watch for changes in your GraphQL schema and automatically regenerate types, use:

```bash
bun run graphql:generate:watch
```

#### Format code

To ensure your codebase follows consistent formatting rules, run:

```bash
bun run format
```

### VS Code debugging

To set up debugging in Visual Studio Code, especially for applications that may be running either locally or within Docker containers, you will need to create a specific configuration file within your project. Here's how to do it:

**Create the `.vscode` directory:** First, ensure that your project has a `.vscode` directory at the root level. If it doesn't exist yet, you can create it manually. This directory is used by VS Code to store configuration files specific to your workspace.

**Create the `launch.json` file:** Inside the `.vscode` directory, create a file named `launch.json`. This JSON file will contain configurations that tell VS Code how to connect to and debug your application.

**Insert the Debugging Configuration:** Copy the provided JSON configuration into your newly created `launch.json` file. This configuration defines two debugging profiles: one for attaching the debugger to a local Node.js process and another for attaching to a Node.js process running inside a Docker container.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
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

**Using the Debugging Profiles:** After setting up the `launch.json` file, you can use VS Code's built-in debugging tools to start a debugging session. Open the Run and Debug sidebar (using the side panel icon or the Ctrl+Shift+D shortcut), select the debugging profile you want to use from the dropdown (either "Attach to Node" for local debugging or "Docker: Attach to Node" for container debugging), and then click the green play button to start the session.

## Folder Structure

### Entities

The **entities** directory is dedicated to defining all business objects. These entities are designed to be simple, containing only essential properties. This approach ensures that the entities remain lightweight and focused on their core purpose. They are designed to encapsulate only the properties that are relevant at the business logic level. There are structured by folders as well.

```
entities/
├── module1/
│ ├── entity1.ts
│ ├── entity2.ts
│ └── ...
├── module2/
│ ├── entity3.ts
│ └── ...
└── ...
```

### Repositories

The **repositories** directory is where all database access mechanisms are housed. It is organized into folders, each representing a specific database table. Each folder contains files corresponding to a function for fetching or mutating data from the database for the specific table.

```
repositories/
├── database/
│ ├── migrations/
│ ├── database.ts
│ ├── models.ts
│ └── ...
├── table1/
│ ├── mappers/
│ ├── get-by-id.ts
│ ├── create.ts
│ ├── update.ts
│ ├── delete.ts
│ └── ...
├── table2/
│ └── ...
└── ...
```

Each repository is designed to interact with the database and return entities. The mappers play a crucial role in this process by transforming the raw database data into more manageable and coherent entity forms. This setup not only enhances code readability but also promotes maintainability and scalability of the application.
By employing both Models and Entities within our repository architecture, we achieve a clean separation of concerns that enhances the maintainability, scalability, and robustness of our application. Models ensure that our interactions with the database are type-safe and reflect the database structure accurately, while Entities allow us to work with business data in a more intuitive and abstracted manner. This structure not only makes our codebase cleaner and more understandable but also facilitates easier adaptation and extension as business requirements evolve.

#### Database

Within the Repositories structure of our application, we have a dedicated folder called **database**. This folder contains all files related to the database connection, migrations, and models.

We are using [Kysely](https://kysely.dev/docs/intro), a tool that help us manage database connections, act as a query builder and handle migrations. It is a lightweight, type-safe, and easy-to-use tool that allows us to interact with the database.

Kysely's query builder is a type-safe, fluent interface that allows developers to construct and execute SQL queries programmatically without writing raw SQL. This means you can build queries through chained method calls, which Kysely then translates into SQL statements. This approach dramatically reduces the risk of SQL injection attacks, ensures that queries are syntactically correct, and leverages TypeScript's type safety to catch errors early in the development process. By abstracting the complexity of raw SQL and leveraging the expressiveness of TypeScript, Kysely's query builder makes database interactions more intuitive, secure, and maintainable.

##### Models

Models are a typed representation of query rows, mirroring the structure of the database precisely. For each column in a database table, there is a corresponding property in the model. For instance, if the database has a column named `email` in a User table, the `Users` model will have a property named `email`.

Models are internal to the repository layer and are intimately linked to the database's structure. They serve as a bridge between the raw database data and the application's business logic, ensuring type safety and integrity of the data being passed through the application.

Kysely is responsible for proper typing based on the database schema. By using `bun run db:generate` command, we can generate models for all tables in the database. This command will create a `models.ts` files with all the tables in the database.

#### Mappers

This folder contains a mapper for each entity and a model to have a typed object of a row returned by a query to the database. The mappers are exclusively used by the repositories and are responsible for converting the database output into entity objects. This separation of concerns ensures that the data layer is cleanly abstracted from the business logic.

Don't be afraid to create a single Entity from multiple Models. If your entity needs to be retrieved using multiple queries, it's fine that you will need two or more Models to map it to a single Entity.

### UseCases

The **usecases** directory is dedicated to implementing the application's use cases. Each use case is encapsulated in its own file, ensuring that each file is responsible for one specific use case. This directory is organized logically into folders, grouping related use cases together for easier navigation and understanding.

```
usecases/
├── module1/
│ ├── usecase1.ts
│ ├── usecase2.ts
│ └── ...
├── module2/
│ ├── usecase3.ts
│ └── ...
└── ...
```

Use Case Structure

- **Single Public Function**: Each use case file contains only one public function. This function is the entry point for executing the use case.
- **Responsibilities**: The use case is responsible for performing validations, orchestrating calls to other methods or services, and ensuring the logical flow of the use case.
- **Readability and Clarity**: The implementation of each use case should be straightforward and easy to follow. Reading through the public function, developers should be able to understand the purpose and flow of the use case easily.

This design ensures that each use case is self-contained, easy to read, and maintain. By having a single entry point, the use cases remain focused and are less prone to becoming overly complex or difficult to understand.

### Graphql

The **graphql** directory is pivotal in structuring the GraphQL API layer of the application. It comprises type definitions, queries, mutations, and resolvers organized into modules for maintainability and ease of understanding.

```
graphql/
├── resolvers/
│ ├── scalars/
│ ├── module1/
│ │ ├── type1.ts
│ │ ├── type1-query.ts
│ │ ├── type1-mutation.ts
│ │ ├── type2.ts
│ │ ├── type2-query.ts
│ │ ├── type2-mutation.ts
│ │ └── ...
│ ├── module2/
│ │ └── ...
│ └── ...
└── ...
```

**Using Entities in Resolvers:** We are using **entities** as internal objects in our resolvers instead of graphql models. This allow us to be more flexible because we can use any attributes from our entities in our resolvers, queries and mutations. This means that we can have "hidden" fields for graphql and only expose the ones we want to be public.

An example of this is the `User` query. A user have an organisation and we want to resolve the User's organisation. If we were using graphql models as internal objects, we would have to add an `organisationId` field in the graphql model and then resolve the `Organisation` model by using this field. The issue is that we don't want to expose the `organisationId` field to the user. That's why we are using `entities` as internal objects. Since entity attributes won't be exposed to the user, we can use the `organisationId` from the entity and expose only the `Organisation` model to the user.

**Field Resolution**: Unlike some GraphQL implementations that rely on auto-resolving fields based on entity attribute names, we take a more explicit approach. Each GraphQL type's field has a corresponding resolve function, even if it directly maps to an entity attribute. This explicitness in field resolution ensures clarity in how data is fetched and transformed, making the API more predictable and easier to debug. It allows for more complex data fetching and transformation logic to be encapsulated cleanly within the resolver functions, providing a clear separation of concerns and making the system more robust and adaptable to changes.

This means that every models in the `schema.graphql` must have a corresponding resolver. Same for each fields of the models.

### Rest

The **rest** directory provides detailed insights into organizing and handling RESTful API endpoints within the project. This structure facilitates the management and expansion of the REST API, ensuring clear separation of concerns and maintainability.

Folder Structure

The REST API's folder structure is designed to encapsulate the various components of RESTful service handling, divided into routes, controllers, DTOs (Data Transfer Objects), and mappers. Each of these components plays a vital role in processing and responding to HTTP requests.

```
rest/
├── routes.ts
├── module1/
│ ├── controllers/
│ ├── dtos/
│ ├── mappers/
│ └── routes.ts
├── module2/
│ └── ...
└── ...
```

**Modules:** Each module directory encapsulates all necessary components for handling its specific set of RESTful endpoints:

- **Controllers:** Located within their respective module directories, controllers are tasked with processing incoming HTTP requests, executing pertinent operations (via use cases or services), and generating the appropriate HTTP responses.

- **DTOs (Data Transfer Objects):** Similar to controllers, DTOs are organized by module. They precisely define the format of data being exchanged with the API—safeguarding data integrity through validation and type safety.

- **Mappers:** Mappers within each module translate data between the domain models (entities) and the DTOs. This layer of abstraction elegantly decouples the internal representations of data from their external forms, facilitating seamless data transformations for API communications.

- **Routes:** Each module features a `routes.ts` file that consolidates all routing definitions pertinent to the module. These definitions explicitly map HTTP methods and paths to controller actions, orchestrating the flow of data and control through the application.

**Application-wide Routes:** The top-level `routes.ts` file serves as the entry point for aggregating all module-specific routes. This central routing file effectively stitches together the various modules, prefixing each with `/api` to differentiate RESTful calls from other types of requests (e.g., GraphQL). This uniform prefix streamlines API call organization and handling, ensuring clarity and consistency across the application's RESTful interface.

This refined RESTful API structure underpins a robust, modular architecture that enhances the application's scalability and maintainability. By allocating each domain-specific set of functionalities within its own module, the structure fosters an intuitive development environment that facilitates clear separation of concerns and efficient navigation throughout the codebase.

### Gateways

The **gateways** directory plays a crucial role in interfacing with external services and APIs, such as email services, identity and access management (IAM), storage solutions, and more. This design pattern is instrumental in abstracting the complexities of interacting with these external systems and providing a clean, unified interface for the rest of the application. Here's an overview of how the gateways section is organized and operates:

**Folder Structure:** The **gateways** directory is divided into sub-folders, each dedicated to a specific type of external service (e.g., email, IAM, storage). This organization makes it straightforward to locate and manage the code that interacts with each specific service, enhancing maintainability and scalability.

**Usage of SDKs:** Whenever possible, gateways utilize the official SDKs provided by the external services. This practice ensures that the integration is done according to the best practices recommended by the service providers, taking advantage of the optimizations and features offered by the SDKs. Utilizing SDKs also significantly reduces the amount of boilerplate code developers need to write, as many common tasks (authentication, error handling, etc.) are handled by the SDK.

**DTOs and Mappers:** In cases where no SDK is available or when a more customized integration is needed, gateways can define their own Data Transfer Objects (DTOs) to represent the data structures required by the external services. Each gateway includes a mappers folder, which contains logic to convert between gateway-specific objects (often DTOs) and the application's internal entities. This conversion ensures that the input to and output from gateway functions are in the form of entities, maintaining consistency and type safety within the application.

**Entities as Input and Output:** The primary function of gateways is to facilitate interaction between the application's core logic and external services without exposing the intricacies of these services. By ensuring that both the input and output of gateway functions are entities, the rest of the application can remain decoupled from the specific requirements or data formats of external services. This approach significantly simplifies the process of integrating with new services or switching between different providers.

**Service-Oriented Gateway Naming:** Gateways are named and designed based on the service they provide rather than the specific external tools or providers they utilize, such as naming a gateway EmailGateway instead of BrevoEmailGateway. This approach maintains flexibility, allowing for easy switching between service providers without impacting the broader application, ensuring provider agnosticism and simplifying refactoring, updates, and code maintenance.

By abstracting the gateway's name and functionality from the specific provider, the application becomes more resilient to changes in third-party services. If there's a need to switch email providers from Brevo to SendGrid, for example, this change can occur within the EmailGateway without affecting any other part of the application that relies on email services. This encapsulation minimizes the impact of external changes on the application's core logic.

## Context object

The **Context Object** (`src/libs/context`) in the application serves as a crucial carrier that threads services and data throughout the various layers of the application, from the entry points (GraphQL/REST APIs) down to use cases, repositories, and gateways. This object ensures that core components of the application, such as configuration settings, logging services, data repositories, external gateways, and authentication details, are readily accessible where needed, promoting a cohesive and well-structured application architecture.

Here’s a closer look at its composition and purpose:

**Core Attributes:** Attributes like `config`, `logger` and `gateways` are instantiated once at the server's startup. These components are foundational to the application's operation, providing essential services such as configuration management, logging and interaction with external services. By initializing these once and passing them through the context, the application ensures efficiency and consistency across requests.

**Request-specific Attributes:** On the other hand, some attributes within the context object, such as `auth` (authentication context) and `repositories`, may be specific to each request. The `auth` attribute, for example, details whether the current user is authenticated, their identifier, and additional information about the session, such as impersonation status. These request-specific details are crucial for enforcing access control and personalizing the application behavior based on the user's state and permissions.

The `repositories` attribute is instanciated at every request because we are using [DataLoaders](https://github.com/graphql/dataloader) to batch multiple database queries into a single request. This design pattern allows us to avoid hitting the database multiple times for the same data. By using **DataLoaders**, we can prevent the [N+1 problem](https://medium.com/the-marcy-lab-school/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a).

**Auth Context Variants:** The AuthContext can represent different states of authentication, such as unauthenticated, authenticated, impersonating, and not impersonating. This flexible structure allows the application to finely control access and operations based on the user's authentication status and whether they are acting on their own behalf or impersonating another user.

**Application-wide Access:** By threading the context object through the application, each layer (GraphQL/REST APIs, use cases, repositories, gateways) has access to shared services and request-specific data. This design pattern not only facilitates a modular and maintainable codebase but also enhances the application's security and performance by centralizing common functionalities and avoiding unnecessary re-instantiations.

In essence, the context object acts as a comprehensive conduit, ensuring that both global services and request-specific data are efficiently passed throughout the application's layers. This approach significantly contributes to the application's scalability, maintainability, and the overall efficiency of resource usage and execution flow.

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
can tell you anything about.

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

## Database Migrations

In our project, database migrations are managed using [Kysely](https://kysely.dev/docs/intro), a TypeScript ORM that provides a type-safe way to interact with your database, including the execution of migrations. Migrations are essential for managing the evolution of your database schema over time. They allow for incremental changes to the database, such as creating or modifying tables, without losing data. Here’s how migrations are handled within the project:

**Kysely for Migrations:** Kysely supports defining migrations that can programmatically alter your database schema. This support includes creating, altering, and dropping tables or columns, among other schema changes.

**Up and Down Functions:** Every migration file must include these two functions to respectively apply and revert the migrations. The `up` function describes the changes to advance the database schema, like creating new tables or adding columns. Conversely, the `down` function defines how to roll back those changes, ensuring that migrations are reversible. This reversibility is crucial for maintaining database integrity and managing changes across different environments smoothly.

**Migration File Naming Convention:** The filenames for migration scripts follow a specific format: `YYYY_MM_DD_HHMMSS_description.ts`. For example, `2024_02_18_164400_init_database.ts`. This format includes the date and time when the migration was created, followed by a short description of the migration. This naming convention helps in organizing migrations chronologically, making it easier to understand the evolution of the database schema over time.

## Dependencies updates

For managing and automating the updates of dependencies within the project, we utilize [Renovate](https://docs.renovatebot.com/), a tool designed to keep dependencies up-to-date automatically. Renovate can be configured to periodically check for updates across all dependencies (libraries, frameworks, tools, etc.) used in the project and to create pull requests (PRs) for each update. This approach ensures that your project benefits from the latest features, performance improvements, and security patches without requiring manual oversight for each dependency. Here's how to set it up:

**Integrating Renovate:** Renovate can be integrated into your project through various platforms such as GitHub, GitLab, Bitbucket, and others. For GitHub, for instance, you can add Renovate by installing the Renovate bot into your repository or by using the Renovate GitHub App. This step involves granting the tool access to your repository so it can monitor dependencies and create PRs.

**Configuration:** Renovate works with a configuration file (renovate.json or renovate.config.js) that you add to the root of your repository. This file allows you to customize Renovate's behavior according to your project's needs. You can specify which dependencies to update, how often to check for updates, whether to group certain updates together, and more. Here's a simple example of a renovate.json configuration:

```json
{
  "extends": ["config:base"],
  "schedule": ["every weekend"],
  "assignees": ["<github_username>"],
  "labels": ["dependencies", "automerge"]
}
```

This configuration tells Renovate to check for updates every weekend, assign the PRs to a specific user, and label them for easier identification.

By using **Renovate**, you can streamline the dependency management process in your project, ensuring that your application remains up-to-date, secure, and stable with minimal manual intervention. This automated approach allows your team to focus more on development and less on maintenance tasks.
