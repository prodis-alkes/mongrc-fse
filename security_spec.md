# MonGRC Firestore Security Specification

## Phase 0: Authorization Invariants & Architecture

### Roles & Trust Boundaries
1. **Bootstrap Admin**: Authenticated user with verified email `budi.hermawan.a@gmail.com`.
2. **Delegated Admin**: Authenticated user whose UID exists in `/admins/{uid}` (created only by Bootstrap Admin) or whose `/users/{uid}` is managed by Admin (write checks use `/admins/{uid}` or bootstrap email so roles cannot be self-escalated).
3. **Auditor**: Authenticated user listed in `/users` with `role == 'Auditor'` and `status == 'active'`. Can read GRC data, post comments, and resolve/review comment threads; cannot mutate Satker scores, users, or global config.
4. **Satker PIC**: Authenticated user listed in `/users/{uid}` with `role == 'Satker PIC'` and `status == 'active'`. Can update scores ONLY for their `assignedSatkerNo` AND ONLY when `/config/app.spreadsheetEditLocked == false`.

### Critical Security Invariants
- **No Unauthenticated Access**: Every rule requires `request.auth != null` (and email verification checks for admin bootstrap/email matching).
- **No Public PII**: `/users/{userId}` (containing `email` and `nip`) is NEVER readable by arbitrary authenticated users (`allow list` never returns all users to non-admins; `allow get` restricts to doc owner, verified email match, or Admin). Passwords are never stored in Firestore.
- **Database-Enforced Edit Lock**: Only Admins can modify `/config/app.spreadsheetEditLocked`. Satker PIC writes to `/satkers/{satkerId}` are rejected by Firestore rules whenever `spreadsheetEditLocked == true`.
- **Immutable Audit Trail**: `/auditLogs/{logId}` supports `create` (attributed to `request.auth.uid == request.resource.data.authorUid`) and forbids `update` and `delete`.
- **Anti-Hijack Ownership**: Comments and audit logs validate `authorUid == request.auth.uid` on `create` and keep `authorUid` immutable on `update`.
- **No `get()`/`exists()` inside `allow list`**: Every `allow list` expression relies purely on token claims or document field checks (`resource.data.*`).
- **Path & Input Validation**: Document IDs checked with `isValidId()`, string lengths bounded, numeric indicator ranges enforced (`0..100` or `0..5`), and enum domains strictly checked.
