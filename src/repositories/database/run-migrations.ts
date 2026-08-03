import { config } from '../../libs/config';
import { migrate } from './migrate';

async function handleMigrationCommand() {
  const command = process.argv[2];

  if (command !== 'up' && command !== 'down') {
    throw new Error('Invalid command. Use "up" or "down".');
  }

  await migrate(config, command);
}

handleMigrationCommand().catch((error) => {
  console.error('Migration failed');
  console.error(error);
  process.exit(1);
});
