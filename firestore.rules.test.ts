/**
 * Phase 0 Security TDD Specification (`firestore.rules.test.ts`)
 * Verifies that all 12 Dirty Dozen adversarial payloads defined in `security_spec.md`
 * are rejected with PERMISSION_DENIED by `firestore.rules`.
 */
export interface DirtyDozenTestCase {
  id: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_SUITE: DirtyDozenTestCase[] = [
  {
    id: '01_identity_spoofing_owner_id',
    collectionPath: '/users/user_alice',
    operation: 'create',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { ownerId: 'user_bob' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '02_shadow_field_injection',
    collectionPath: '/users/user_alice',
    operation: 'update',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '03_unverified_email_token',
    collectionPath: '/users/user_alice',
    operation: 'create',
    authUid: 'user_alice',
    emailVerified: false,
    payload: { ownerId: 'user_alice' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '04_cross_user_pii_read',
    collectionPath: '/users/user_alice/private/info',
    operation: 'get',
    authUid: 'user_bob',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '05_id_poisoning_oversized_id',
    collectionPath: `/users/${'a'.repeat(200)}`,
    operation: 'create',
    authUid: 'a'.repeat(200),
    emailVerified: true,
    payload: { ownerId: 'a'.repeat(200) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '06_array_overflow_inventory',
    collectionPath: '/users/user_alice',
    operation: 'update',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { inventory: Array.from({ length: 35 }, (_, i) => `item_${i}`) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '07_array_type_poisoning',
    collectionPath: '/users/user_alice',
    operation: 'update',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { inventory: [99999] },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '08_immortal_field_created_at_mutation',
    collectionPath: '/users/user_alice',
    operation: 'update',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '09_forged_client_timestamp',
    collectionPath: '/users/user_alice',
    operation: 'create',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { updatedAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '10_orphaned_subcollection_write',
    collectionPath: '/users/non_existent_user/matches/match_1',
    operation: 'create',
    authUid: 'non_existent_user',
    emailVerified: true,
    payload: { ownerId: 'non_existent_user', mode: 'race', status: 'active', rpDelta: 25 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '11_terminal_state_unlock_completed_match',
    collectionPath: '/users/user_alice/matches/match_1',
    operation: 'update',
    authUid: 'user_alice',
    emailVerified: true,
    payload: { status: 'active', rpDelta: 9999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: '12_blanket_list_query_scraping',
    collectionPath: '/users',
    operation: 'list',
    authUid: 'user_alice',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
];
