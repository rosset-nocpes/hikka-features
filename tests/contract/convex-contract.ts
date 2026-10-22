/**
 * Checks the hand-written mirror in `utils/convex-api.ts` against the
 * backend's generated API in the sibling `features-backend` checkout. Run
 * with `bun run check:contract`; a mismatch fails as a type error naming
 * the function and what disagrees.
 */
import type { FunctionReference } from 'convex/server';

import type { convexApi } from '@/utils/convex-api';

import type { api } from '../../../features-backend/convex/_generated/api';

type AnyReference = FunctionReference<'query' | 'mutation' | 'action'>;

/** Document ids are strings on the wire; the extension sends plain ones. */
type Loosen<T> = T extends { __tableName: string }
  ? string
  : T extends readonly (infer Item)[]
    ? Loosen<Item>[]
    : T extends object
      ? { [K in keyof T]: Loosen<T[K]> }
      : T;

/** Convex rejects arguments its validator doesn't list. */
type ExtraArgs<Sent, Accepted> = string extends keyof Sent
  ? never
  : Exclude<keyof Sent, keyof Accepted>;

type ReferenceMismatch<
  Mirror extends AnyReference,
  Backend,
  Path extends string,
> = Backend extends AnyReference
  ? [Mirror['_type']] extends [Backend['_type']]
    ? [ExtraArgs<Mirror['_args'], Backend['_args']>] extends [never]
      ? [Mirror['_args']] extends [Loosen<Backend['_args']>]
        ? [Backend['_returnType']] extends [Mirror['_returnType']]
          ? never
          : `${Path}: backend returns a shape the mirror doesn't expect`
        : `${Path}: args the backend doesn't accept`
      : `${Path}: sends args the backend doesn't know (${ExtraArgs<Mirror['_args'], Backend['_args']> & string})`
    : `${Path}: is a ${Backend['_type']} on the backend`
  : `${Path}: not a public function on the backend`;

type Mismatches<Mirror, Backend, Prefix extends string = ''> = {
  [K in keyof Mirror & string]: K extends keyof Backend
    ? Mirror[K] extends AnyReference
      ? ReferenceMismatch<Mirror[K], Backend[K], `${Prefix}${K}`>
      : Mismatches<Mirror[K], Backend[K], `${Prefix}${K}.`>
    : `${Prefix}${K}: missing on the backend`;
}[keyof Mirror & string];

// Each mismatch is a required key, so the error lists all of them.
export const contract: Record<
  Mismatches<typeof convexApi, typeof api>,
  true
> = {};
