# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Master Gate (`/users/{userId}`)**:
   - Every `/users/{userId}` document is owned exclusively by `userId == request.auth.uid` and `data.ownerId == request.auth.uid`.
   - Subcollections `/users/{userId}/private/{docId}` and `/users/{userId}/matches/{matchId}` enforce the **Master Gate** by verifying `userId == request.auth.uid` and checking `get(/databases/$(database)/documents/users/$(userId)).data.ownerId == request.auth.uid` (or `existsAfter(/databases/$(database)/documents/users/$(userId))` for atomic batch initialization).
2. **PII Split Collection (`/users/{userId}/private/{docId}`)**:
   - All PII (`email`) is strictly isolated in `/users/{userId}/private/{docId}` (`docId == 'info'`) and never stored on `/users/{userId}`.
3. **Verified Users & Temporal Integrity**:
   - All writes require `request.auth != null && request.auth.token.email_verified == true`.
   - `createdAt == request.time` on create; `createdAt == existing().createdAt` (immutable) and `updatedAt == request.time` on update.
4. **Terminal State Locking (`/users/{userId}/matches/{matchId}`)**:
   - Once `existing().status == 'completed'`, any subsequent update to `/users/{userId}/matches/{matchId}` is strictly denied.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 01 — Identity Spoofing (`ownerId` mismatch)**:
   - Write to `/users/uid_alice` with `{ ownerId: "uid_bob", ... }` → `PERMISSION_DENIED`.
2. **Payload 02 — Shadow Field Injection (`isAdmin: true`)**:
   - Write to `/users/uid_alice` with an undeclared field `{ ..., isAdmin: true }` → `PERMISSION_DENIED` via `.keys().hasOnly(...)`.
3. **Payload 03 — Unverified Email Write (`email_verified: false`)**:
   - Authenticated write with `request.auth.token.email_verified == false` → `PERMISSION_DENIED`.
4. **Payload 04 — Cross-User PII Read (`/users/uid_alice/private/info`)**:
   - User `uid_bob` attempts `get` on `/users/uid_alice/private/info` → `PERMISSION_DENIED`.
5. **Payload 05 — ID Poisoning (2KB Document ID)**:
   - Create document with 2,000-character ID or invalid regex characters → `PERMISSION_DENIED` via `isValidId()`.
6. **Payload 06 — Array Overflow (`inventory` > 30 items)**:
   - Update `/users/uid_alice` with `inventory` of 50 items → `PERMISSION_DENIED`.
7. **Payload 07 — Array Type Poisoning (`inventory: [12345]`)**:
   - Update `/users/uid_alice` with non-string first element in `inventory` → `PERMISSION_DENIED`.
8. **Payload 08 — Immortal Field Mutation (`createdAt` modified on update)**:
   - Update `/users/uid_alice` changing `createdAt` → `PERMISSION_DENIED`.
9. **Payload 09 — Client Timestamp Forgery (`updatedAt != request.time`)**:
   - Write to `/users/uid_alice` with past/future client timestamp → `PERMISSION_DENIED`.
10. **Payload 10 — Orphaned Subcollection Write (`/users/uid_missing/matches/m1`)**:
    - Create match under non-existent parent `/users/uid_missing` → `PERMISSION_DENIED` via Master Gate `exists`/`get`.
11. **Payload 11 — Terminal State Re-Open (`status: 'completed' -> 'active'`)**:
    - Update `/users/uid_alice/matches/m1` after `status == 'completed'` → `PERMISSION_DENIED`.
12. **Payload 12 — Unauthorized List Scraping (`list /users`)**:
    - Attempt blanket `list` on `/users` without `where('ownerId', '==', request.auth.uid)` → `PERMISSION_DENIED`.
