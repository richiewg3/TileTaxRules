# Security Specification - Hello World Firebase

## Data Invariants
- A message must have a `text` (string, max 1000 chars).
- A message must have an `authorId` which matches the current authenticated user's UID.
- A message must have a `createdAt` timestamp set to the server time.
- Users can only delete their own messages.
- No one can update messages once created.

## The "Dirty Dozen" Payloads (Red Team Tests)

1. **Anonymous Write**: Attempt to create a message without being logged in.
   - Status: REJECTED
2. **Identity Spoofing**: Attempt to create a message with an `authorId` that is not the current user's UID.
   - Status: REJECTED
3. **Invalid Type**: Attempt to create a message where `text` is a number or boolean.
   - Status: REJECTED
4. **Oversized Payload**: Attempt to create a message with a string > 1000 characters.
   - Status: REJECTED
5. **Ghost Fields**: Attempt to create a message with extra fields like `isAdmin: true`.
   - Status: REJECTED
6. **Self-Assigned Admin**: Attempt to write to a hypothetical `admins` collection.
   - Status: REJECTED (via Global Safety Net)
7. **Client Timestamp**: Attempt to create a message with a client-provided timestamp instead of `request.time`.
   - Status: REJECTED
8. **Malicious ID**: Attempt to create a message with a 1MB string as the document ID.
   - Status: REJECTED (via `isValidId` size check)
9. **Unauthorized Update**: Attempt to change the `text` of an existing message.
   - Status: REJECTED
10. **Unauthorized Delete**: Attempt to delete someone else's message.
    - Status: REJECTED
11. **Blanket List Read**: Attempt to read the entire `messages` collection without being signed in.
    - Status: REJECTED
12. **Path Poisoning**: Attempt to write to a nested path like `/messages/msg1/secret/doc`.
    - Status: REJECTED (via Global Safety Net)

## Test Summary
The defined `firestore.rules` implement the "Master Gate" pattern and address all scenarios above.
- `allow create`: Enforces `isValidMessage` (schema/auth) and `isValidId`.
- `allow delete`: Enforces `isOwner`.
- `match /{document=**}`: Default deny-all.
