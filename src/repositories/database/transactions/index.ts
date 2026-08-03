import { Kysely, Transaction } from 'kysely';
import { DB } from '../models';

export type TransactionContext = Transaction<DB>;

export function initTransactionRepository(db: Kysely<DB>) {
  return {
    transaction: () => db.transaction(),
  };
}
