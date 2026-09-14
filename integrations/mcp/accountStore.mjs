import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function principalKey(principal) {
  if (!principal?.subject || !principal?.issuer) throw new Error('principal-required');
  return createHash('sha256').update(`${principal.issuer}\0${principal.subject}`).digest('hex');
}

function normalizedSnapshot(snapshot) {
  if (!snapshot?.thread?.id || typeof snapshot.thread.id !== 'string') throw new Error('thread-id-required');
  const now = new Date().toISOString();
  return {
    thread: {
      ...snapshot.thread,
      id: snapshot.thread.id.trim(),
      title: typeof snapshot.thread.title === 'string' ? snapshot.thread.title.slice(0, 500) : 'Untitled thread',
      updatedAt: now,
    },
    decisions: Array.isArray(snapshot.decisions) ? snapshot.decisions : [],
    commitments: Array.isArray(snapshot.commitments) ? snapshot.commitments : [],
    assumptions: Array.isArray(snapshot.assumptions) ? snapshot.assumptions : [],
    meetings: Array.isArray(snapshot.meetings) ? snapshot.meetings : [],
    syncedAt: now,
  };
}

function summary(snapshot) {
  return {
    id: snapshot.thread.id,
    title: snapshot.thread.title,
    updatedAt: snapshot.thread.updatedAt ?? snapshot.syncedAt,
    counts: {
      decisions: snapshot.decisions.length,
      commitments: snapshot.commitments.length,
      assumptions: snapshot.assumptions.length,
      meetings: snapshot.meetings.length,
    },
  };
}

export function createInMemoryAccountStore() {
  const accounts = new Map();
  const accountFor = (principal) => {
    const key = principalKey(principal);
    let account = accounts.get(key);
    if (!account) {
      account = new Map();
      accounts.set(key, account);
    }
    return account;
  };

  return {
    kind: 'memory',
    async ready() { return true; },
    async listThreads(principal) {
      return [...accountFor(principal).values()]
        .map(summary)
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
    },
    async getThread(principal, threadId) {
      return clone(accountFor(principal).get(threadId) ?? null);
    },
    async putThread(principal, snapshot) {
      const normalized = normalizedSnapshot(snapshot);
      accountFor(principal).set(normalized.thread.id, clone(normalized));
      return clone(normalized);
    },
    async deleteThread(principal, threadId) {
      return accountFor(principal).delete(threadId);
    },
  };
}

async function readAccount(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return parsed && typeof parsed === 'object' && parsed.threads && typeof parsed.threads === 'object'
      ? parsed
      : { version: 1, threads: {} };
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, threads: {} };
    throw error;
  }
}

async function atomicWrite(file, payload) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 });
  await rename(temp, file);
}

export function createFileAccountStore(rootDirectory) {
  const root = resolve(rootDirectory);
  const fileFor = (principal) => join(root, `${principalKey(principal)}.json`);
  let writeChain = Promise.resolve();

  async function mutate(principal, operation) {
    const run = writeChain.then(async () => {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const file = fileFor(principal);
      const account = await readAccount(file);
      const result = await operation(account);
      await atomicWrite(file, account);
      return result;
    });
    writeChain = run.catch(() => undefined);
    return run;
  }

  return {
    kind: 'filesystem',
    async ready() {
      await mkdir(root, { recursive: true, mode: 0o700 });
      return true;
    },
    async listThreads(principal) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const account = await readAccount(fileFor(principal));
      return Object.values(account.threads)
        .map(summary)
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
    },
    async getThread(principal, threadId) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const account = await readAccount(fileFor(principal));
      return clone(account.threads[threadId] ?? null);
    },
    async putThread(principal, snapshot) {
      return mutate(principal, (account) => {
        const normalized = normalizedSnapshot(snapshot);
        account.threads[normalized.thread.id] = normalized;
        return clone(normalized);
      });
    },
    async deleteThread(principal, threadId) {
      return mutate(principal, (account) => {
        const existed = Object.hasOwn(account.threads, threadId);
        delete account.threads[threadId];
        return existed;
      });
    },
  };
}

export function accountPrincipalFromAuthInfo(authInfo) {
  const subject = authInfo?.extra?.subject;
  const issuer = authInfo?.extra?.issuer;
  if (typeof subject !== 'string' || !subject.trim() || typeof issuer !== 'string' || !issuer.trim()) {
    throw new Error('authenticated-principal-required');
  }
  return { subject: subject.trim(), issuer: issuer.trim() };
}
