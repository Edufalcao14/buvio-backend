/**
 * graphql-ws v6 exposes its server helpers through an exports map, which this
 * project's classic module resolution does not read.
 *
 * The types are declared here rather than through a tsconfig `paths` entry:
 * Bun honours `paths` at RUNTIME too, so mapping this specifier to a `.d.ts`
 * made the server import a declaration file and crash on boot.
 */
declare module 'graphql-ws/use/ws' {
  export { useServer } from 'graphql-ws/dist/use/ws';
}
