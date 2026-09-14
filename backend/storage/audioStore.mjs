import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function safeKey(key) {
  if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error('Invalid audio object key.');
  return key;
}

export function createInMemoryAudioStore() {
  const objects = new Map();
  return {
    kind: 'memory',
    async ready() { return true; },
    async write(_sessionId, audio) {
      const key = `audio-${randomBytes(18).toString('hex')}`;
      objects.set(key, Buffer.from(audio));
      return { key, bytes: audio.length };
    },
    async read(ref) {
      const audio = objects.get(ref.key);
      if (!audio) throw new Error('Audio object not found.');
      return Buffer.from(audio);
    },
    async remove(ref) {
      objects.delete(ref.key);
    },
    async exists(ref) {
      return objects.has(ref.key);
    },
  };
}

export function createFileAudioStore(rootDir) {
  const audioDir = join(rootDir, 'audio');

  async function ensureReady() {
    await mkdir(audioDir, { recursive: true, mode: 0o700 });
  }

  function pathFor(ref) {
    return join(audioDir, safeKey(ref.key));
  }

  return {
    kind: 'filesystem',
    async ready() {
      try {
        await ensureReady();
        return true;
      } catch {
        return false;
      }
    },
    async write(sessionId, audio) {
      await ensureReady();
      const safeSession = sessionId.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'session';
      const key = `${safeSession}-${randomBytes(18).toString('hex')}.audio`;
      await writeFile(join(audioDir, key), audio, { mode: 0o600 });
      return { key, bytes: audio.length };
    },
    async read(ref) {
      await ensureReady();
      return readFile(pathFor(ref));
    },
    async remove(ref) {
      await ensureReady();
      try {
        await unlink(pathFor(ref));
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    },
    async exists(ref) {
      await ensureReady();
      try {
        await readFile(pathFor(ref));
        return true;
      } catch (error) {
        if (error?.code === 'ENOENT') return false;
        throw error;
      }
    },
  };
}
