# Realtime runs over GraphQL subscriptions, not a separate socket

The live voting experience — who has voted, the running participation, the
moment a session closes — needs a push channel. We use `graphql-ws`
subscriptions on the existing Apollo Server rather than adding socket.io
alongside it.

The reason is that everything the transport needs already exists once: the
schema, the auth context, the error shape, and the client codegen that turns an
operation into a typed React hook. A second socket would mean a second
authentication path, a second serialization format and hand-written types on
both sides, for a channel that carries the same domain objects the queries
already return.

## Considered options

**socket.io** was rejected for the duplication above, not for capability — its
rooms and reconnection handling are better out of the box, and we accept
having to configure reconnection ourselves.

**Polling** was ruled out by the product: a running vote where the score
appears seconds late reads as broken.

## Consequences

Subscription events carry the full updated state rather than a "something
changed" ping, so the UI animates straight from the payload. That makes
payloads larger and means every event must be safe for every subscriber on that
session to see.

The live Tally travels in those events by product decision: watching the count
move is the point of the ritual. The Verdict does not — it appears only in the
event that closes the session, so "who won" has exactly one reveal.
