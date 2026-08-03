import { PubSub } from 'graphql-subscriptions';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';

/**
 * The in-process event bus behind GraphQL subscriptions.
 *
 * In-memory on purpose: one server process serves this app today, and a
 * Redis-backed bus is the change to make when a second one appears. Nothing
 * outside this module knows which it is.
 */
export type VotingSessionEvent = {
  votingSession: VotingSessionEntity;
};

const VOTING_SESSION_TOPIC = 'VOTING_SESSION_UPDATED';

export const topicForVotingSession = (votingSessionId: string): string =>
  `${VOTING_SESSION_TOPIC}:${votingSessionId}`;

export const initEvents = (pubsub: PubSub = new PubSub()) => ({
  /** Publishes the session's new state to everyone watching it. */
  publishVotingSession: async (session: VotingSessionEntity): Promise<void> => {
    await pubsub.publish(topicForVotingSession(session.id), {
      votingSession: session,
    } satisfies VotingSessionEvent);
  },
  subscribeToVotingSession: (votingSessionId: string) =>
    pubsub.asyncIterableIterator<VotingSessionEvent>(
      topicForVotingSession(votingSessionId),
    ),
});

export type Events = ReturnType<typeof initEvents>;
