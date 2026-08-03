# Voting session closure is stored, not derived

A Voting Session used to have only `closing_at`, and its status was computed on
every read: past that moment it counted as closed. That cannot express the two
other ways a session ends — an Admin closing it early, or every Player
completing their Ballot — and it gives no single instant that all clients agree
on, which a live result reveal needs.

We now store `closed_at` and `closed_reason` (`ADMIN | DEADLINE | UNANIMOUS`)
on the session. `closing_at` keeps its old meaning: the moment the session is
_scheduled_ to close. Both columns exist on purpose — one is the plan, the
other is what happened.

## Consequences

A deadline no longer closes a session by itself, since nothing recomputes it:
an idempotent sweeper closes overdue sessions and publishes the event. Any read
path that needs to be correct between sweeps should treat an overdue open
session as closed.
