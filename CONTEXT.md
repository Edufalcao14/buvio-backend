# Buvio

Buvio is the third half — _la troisième mi-temps_ — made into an app: an
amateur football squad plays a match, then gathers to crown its Top and roast
its Flop.

## Language

### The match

**Team**:
A squad of Players who play Matches together. Joined with an invite code.
_Avoid_: club, group

**Player**:
A person on a Team's roster. The same person is a Player in the squad and a
voter in a Voting Session.
_Avoid_: member, user (in social contexts)

**Match**:
One game played by a Team, carrying its own roster and at most one Voting
Session.
_Avoid_: game, fixture

### The ritual

**Voting Session**:
The post-match ritual in which the squad decides its Top and its Flop. It is
either open — accepting Ballots — or closed, after which its Verdict is public
and can never change.
_Avoid_: poll, election, vote (for the session as a whole)

**Tally**:
The live count while a session is open: who has voted, and who is collecting
Tops and Flops so far. It is public on purpose — watching the count move is
part of the ritual — and it means nothing until it becomes a Verdict.
_Avoid_: partial result, provisional verdict

**Ballot**:
Everything one Player casts in one Voting Session: a Top and a Flop, for two
different teammates. Complete only when both are cast.
_Avoid_: submission, entry

**Vote**:
A single choice inside a Ballot — one voter, one voted-for Player, one type
(Top or Flop), and an optional Comment.

**Top**:
The teammate a voter crowns. Also the Player who received the most Top votes in
a closed session.
_Avoid_: MVP, best player, winner

**Flop**:
The teammate a voter roasts. Affectionate, never cruel.
_Avoid_: worst player, loser

**Comment**:
The short note a voter may attach to a Vote. Optional, and never required to
complete a Ballot.

**Verdict**:
The outcome of a _closed_ Voting Session: its Top and its Flop. A session that
closed without votes in both categories has no Verdict — there is no half
verdict. A Tally is never a Verdict, however lopsided it looks.
_Avoid_: result, score

**Closure Reason**:
Why a Voting Session closed. Exactly one of **Admin** (the Player who started
it ended it), **Deadline** (it reached its scheduled closing time), or
**Unanimous** (every Player on the roster completed their Ballot).

**Admin**:
The Player who started a given Voting Session, and the only one who may close
it early. Not a team-wide role: a different Player may be the Admin of the next
session.
_Avoid_: owner, moderator, captain

### Identity

**Display Name**:
A Player's real name, used where identity matters: profile and settings.
_Avoid_: full name, real name

**Nickname**:
The name a Player is known by in the squad. It rules every social surface —
voting, standings, history. Falls back to the first word of the Display Name
when unset.
_Avoid_: alias, handle, username

**Avatar**:
A Player's own picture, chosen at sign-up and changeable later. Shown wherever
that Player appears.
_Avoid_: profile picture, photo, pfp

**Crest**:
A Team's badge. A monogram of the team's initials until the Team uploads its
own image.
_Avoid_: logo, team photo

### The table

**Standing**:
One Player's tally of Top and Flop votes, counted across closed Voting Sessions
only.

**Podium**:
The three Players leading a category. The standings screen shows two: most Tops
and most Flops.
_Avoid_: leaderboard, ranking table

## Rules that shape the language

A Ballot cannot name its own caster, cannot name someone off the roster, and
cannot give the same teammate both Top and Flop. Because of those rules a
complete Ballot is impossible on a roster of two, so **Unanimous** closure
applies only to rosters of three or more; smaller Matches close by Admin or
Deadline.
