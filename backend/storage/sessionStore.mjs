import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const STORE_VERSION = 1;

export function hashUploadToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function createInMemorySessionStore() {
  const sessions = new Map();
  return {
    kind: 'memory',
    async ready() { return true; },
    async put(session) {
      sessions.set(session.id, clone(session));
      return clone(session);
    },
    async get(id) {
      return clone(sessions.get(id));
    },
    async findByUploadToken(token) {
      const digest = hashUploadToken(token);
      for (const session of sessions.values()) {
        if (session.uploadTokenHash === digest) return clone(session);
      }
      return undefined;
    },
    async remove(id) {
      sessions.delete(id);
    },
    async list() {
      return [...sessions.values()].map(clone);
    },
  };
}

function sessionFileName(id) {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new Error('Invalid session id for filesystem storage.');
  return `${id}.json`;
}

export function createFileSessionStore(rootDir) {
  const sessionsDir = join(rootDir, 'sessions');

  async function ensureReady() {
    await mkdir(sessionsDir, { recursive: true, mode: 0o700 });
  }

  async function put(session) {
    await ensureReady();
    const path = join(sessionsDir, sessionFileName(session.id));
    const temp = `${path}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    const payload = JSON.stringify({ storeVersion: STORE_VERSION, session });
    await writeFile(temp, payload, { encoding: 'utf8', mode: 0o600 });
    await rename(temp, path);
    return clone(session);
  }

  async function get(id) {
    await ensureReady();
    try {
      const raw = await readFile(join(sessionsDir, sessionFileName(id)), 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.storeVersion !== STORE_VERSION || !parsed.session || parsed.session.id !== id) {
        throw new Error('Unsupported or corrupt persisted session record.');
      }
      return parsed.session;
    } catch (error) {
      if (error?.code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async function list() {
    await ensureReady();
    const files = (await readdir(sessionsDir)).filter((name) => name.endsWith('.json'));
    const records = [];
    for (const file of files) {
      const id = file.slice(0, -'.json'.length);
      const session = await get(id);
      if (session) records.push(session);
    }
    return records;
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
    put,
    get,
    async findByUploadToken(token) {
      const digest = hashUploadToken(token);
      const sessions = await list();
      return sessions.find((session) => session.uploadTokenHash === digest);
    },
    async remove(id) {
      await ensureReady();
      try {
        await unlink(join(sessionsDir, sessionFileName(id)));
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    },
    list,
  };
}
