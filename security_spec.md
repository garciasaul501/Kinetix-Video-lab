# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All unspecified paths are strictly denied (`allow read, write: if false`).
2. **Verified Identity**: All writes and private reads require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Privilege Isolation**:
   - Only the verified bootstrapped owner (`request.auth.token.email == 'garciasaul501@gmail.com' && request.auth.token.email_verified == true`) or UIDs present in `/admins/{uid}` have administrator privileges.
   - Regular users can NEVER self-assign `role: 'admin'`, modify `role`, or grant themselves paid `planTier` or `subscriptionStatus: 'active'` without either Admin authority or an explicit paid order transition.
4. **PII Isolation**:
   - `/users/{userId}` contains `email` and is readable ONLY by `request.auth.uid == userId` or Admin. Blanket `isSignedIn()` reads are forbidden.
5. **Immutable Ownership & Server Timestamps**:
   - `uid` / `userId` / `orderId` and `createdAt` are immutable after creation.
   - `createdAt` on create and `updatedAt` / `lastActiveAt` on update MUST equal `request.time`.
6. **Terminal Order Locking**:
   - Once `/orders/{orderId}` reaches `status: 'paid'`, non-admin users cannot alter or roll back the order.
7. **Strict Keys & Size Bounds**:
   - Every string enforces explicit `.size()` min/max bounds matching `firebase-blueprint.json`.
   - Every document ID on single-document operations matches `^[a-zA-Z0-9_\-]+$` (`size <= 128`).
   - Every `create` uses `hasAll` + `hasOnly`; every `update` starts with `isValid[Entity](incoming())` and restricts changed keys via `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Admin Registration**: Regular user creates `/users/{uid}` with `role: "admin"`.
2. **Self-Admin Promotion**: Regular user updates `/users/{uid}` changing `role` to `"admin"`.
3. **Free-to-VIP Self-Upgrade**: Regular user updates `/users/{uid}` changing `planTier` to `"vip"` and `tokenBalance` to `9999999` without Admin role.
4. **Shadow Ghost Field Injection**: User creates or updates `/users/{uid}` with extra field `isSuperUser: true`.
5. **PII Cross-User Read**: Regular user A attempts `get` on `/users/{userB}`.
6. **Unscoped List Scraping**: Regular user attempts `list` on `/users` without matching `uid == request.auth.uid`.
7. **Unverified Admin Email Spoof**: Caller with matching admin email but `email_verified: false` attempts admin read/write.
8. **Fake Server Timestamp**: User creates `/usageEvents/{id}` with client-forged `createdAt` != `request.time`.
9. **Usage Event Identity Spoof**: User A creates `/usageEvents/{id}` with `userId: "userB"`.
10. **Terminal Order Tampering**: Non-admin user updates a `paid` order in `/orders/{orderId}` to change `amountUsd` or `status`.
11. **Non-Admin Settings Takeover**: Regular user attempts to update `/appSettings/monetization`.
12. **Oversized ID / String Poisoning**: User attempts to create `/usageEvents/<200-char-junk>` or a `summary` string exceeding 240 chars.
