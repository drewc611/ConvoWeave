import { resolve } from 'node:path';
import { createFileAudioStore, createInMemoryAudioStore } from './audioStore.mjs';
import { createFileSessionStore, createInMemorySessionStore } from './sessionStore.mjs';

export function createStorage(config) {
  if (config.storage.mode === 'memory') {
    return {
      sessionStore: createInMemorySessionStore(),
      audioStore: createInMemoryAudioStore(),
    };
  }

  if (config.storage.mode === 'filesystem') {
    const root = resolve(config.storage.dataDir);
    return {
      sessionStore: createFileSessionStore(root),
      audioStore: createFileAudioStore(root),
    };
  }

  throw new Error(`Unsupported storage mode: ${config.storage.mode}`);
}
