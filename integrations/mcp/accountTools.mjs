import { accountPrincipalFromAuthInfo } from './accountStore.mjs';
import { hasScope } from './auth.mjs';
import { prepareBrief } from './tools.mjs';

function requireScope(authInfo, scope) {
  if (!hasScope(authInfo, scope)) throw new Error(`Missing required OAuth scope: ${scope}`);
}

export function createAccountToolHandlers({ authInfo, accountStore, scopeNames = { read: 'convoweave.read', write: 'convoweave.write' } }) {
  if (!authInfo) return null;
  const principal = accountPrincipalFromAuthInfo(authInfo);

  return {
    async listThreads() {
      requireScope(authInfo, scopeNames.read);
      return { threads: await accountStore.listThreads(principal) };
    },
    async getThread({ threadId }) {
      requireScope(authInfo, scopeNames.read);
      const snapshot = await accountStore.getThread(principal, threadId);
      if (!snapshot) throw new Error('Thread not found.');
      return snapshot;
    },
    async upsertThread({ snapshot }) {
      requireScope(authInfo, scopeNames.write);
      return accountStore.putThread(principal, snapshot);
    },
    async deleteThread({ threadId }) {
      requireScope(authInfo, scopeNames.write);
      const deleted = await accountStore.deleteThread(principal, threadId);
      return { deleted, threadId };
    },
    async prepareAccountBrief({ threadId }) {
      requireScope(authInfo, scopeNames.read);
      const snapshot = await accountStore.getThread(principal, threadId);
      if (!snapshot) throw new Error('Thread not found.');
      return {
        threadId,
        ...prepareBrief({
          threadTitle: snapshot.thread.title,
          decisions: snapshot.decisions,
          commitments: snapshot.commitments,
          assumptions: snapshot.assumptions,
        }),
      };
    },
  };
}
