/**
 * Firestore Security Rules Test Specification (Dirty Dozen Adversarial Suite)
 * Verifies all 12 attack vectors defined in security_spec.md against firestore.rules.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Admin Registration on /users/{uid}',
    collection: 'users/userA',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'userA', role: 'admin', planTier: 'vip', subscriptionStatus: 'active' },
  },
  {
    id: 2,
    name: 'Self-Admin Role Escalation on update',
    collection: 'users/userA',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { role: 'admin' },
  },
  {
    id: 3,
    name: 'Unauthorized Token Balance Inflation on activity update',
    collection: 'users/userA',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { tokenBalance: 9999999, projectsCreated: 1 },
  },
  {
    id: 4,
    name: 'Shadow Ghost Field Injection',
    collection: 'users/userA',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'userA', role: 'subscriber', isSuperUser: true },
  },
  {
    id: 5,
    name: 'Cross-User PII Read',
    collection: 'users/userB',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 6,
    name: 'Unscoped Users Collection List Scraping',
    collection: 'users',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 7,
    name: 'Unverified Email Admin Spoofing',
    collection: 'appSettings/monetization',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { freeProjectsLimit: 99 },
  },
  {
    id: 8,
    name: 'Forged Client Timestamp on UsageEvent',
    collection: 'usageEvents/evt-1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'userA', createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 9,
    name: 'UsageEvent Identity Spoofing',
    collection: 'usageEvents/evt-2',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'userB', eventType: 'session_start' },
  },
  {
    id: 10,
    name: 'Terminal Paid Order Tampering by Non-Admin',
    collection: 'orders/KTX-100',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'cancelled', amountUsd: 0 },
  },
  {
    id: 11,
    name: 'Non-Admin Monetization Settings Mutation',
    collection: 'appSettings/monetization',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { trialPriceUsd: 1 },
  },
  {
    id: 12,
    name: 'Oversized Summary String Poisoning',
    collection: 'usageEvents/evt-3',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'userA', summary: 'x'.repeat(500) },
  },
];
