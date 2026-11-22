import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestActor, RequestContextStore } from './request-context.types.js';

/**
 * Request-scoped context backed by AsyncLocalStorage. Lets deep services (e.g. the
 * audit log) know who is acting and which request they serve, while every
 * provider stays a cheap singleton (no REQUEST-scoped DI).
 */
@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  get(): RequestContextStore {
    return this.storage.getStore() ?? {};
  }

  /** Attaches the authenticated user to the current request's context. */
  setActor(actor: RequestActor): void {
    const store = this.storage.getStore();
    if (store) {
      store.actor = actor;
    }
  }
}
