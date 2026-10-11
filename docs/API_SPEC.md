# API_SPEC.md — API Specification & Endpoint Contracts

All API endpoints follow RESTful conventions, accept `application/json`, and return structured JSON responses.

## 1. Standard Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional informative message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [ ... ]
  }
}
```

## 2. Authentication & Account Endpoints

### `POST /api/auth/register`
- **Rate Limit**: 30 requests / 15 min
- **Body**: `{ "email": "user@example.com", "password": "securePassword123!", "name": "Jane Doe" }`
- **Response**: `201 Created` with `{ "token": "jwt_token", "user": { "id": "...", "email": "...", "name": "...", "isEmailVerified": false } }`

### `POST /api/auth/login`
- **Rate Limit**: 15 requests / 15 min
- **Body**: `{ "email": "user@example.com", "password": "securePassword123!" }`
- **Response**: `200 OK` with `{ "token": "jwt_token", "user": { "id": "...", "email": "...", "name": "...", "isEmailVerified": true } }`

### `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with `{ "message": "Signed out successfully." }`. Revokes server-side session.

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with user profile, email verification status, and creation date.

### `POST /api/auth/forgot-password`
- **Rate Limit**: 6 requests / 15 min
- **Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK` generic message preventing email enumeration. Dispatches single-use expiring token.

### `POST /api/auth/reset-password`
- **Rate Limit**: 6 requests / 15 min
- **Body**: `{ "token": "...", "password": "newSecurePassword2026!" }`
- **Response**: `200 OK` updates password, marks reset token used, and invalidates existing sessions.

### `POST /api/auth/verify-email`
- **Body**: `{ "token": "..." }`
- **Response**: `200 OK` marks user email as verified.

### `POST /api/auth/resend-verification`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` dispatches new verification link.

### `PATCH /api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "Updated Name" }`
- **Response**: `200 OK` with updated profile.

### `POST /api/auth/change-password`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "currentPassword": "...", "newPassword": "..." }`
- **Response**: `200 OK` updates password and revokes other active sessions.

### `GET /api/auth/sessions`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` returns list of active devices/sessions with current session indicator.

### `DELETE /api/auth/sessions/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` revokes target session.

### `DELETE /api/auth/account`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "password": "..." }`
- **Response**: `200 OK` cascades and deletes user account, projects, versions, and sessions.

---

## 3. Projects Endpoints

### `GET /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `?search=&dialect=&sort=updatedAt:desc`
- **Response**: `200 OK` list of user projects.

### `POST /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "E-Commerce Billing",
    "description": "Multi-tenant invoicing schema",
    "targetDialect": "postgresql",
    "requirementsPrompt": "Users place orders containing items..."
  }
  ```
- **Response**: `201 Created` with project entity.

### `GET /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with complete project details, canonical schema, and canvas layout.

### `PATCH /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Updates project metadata (name, description, targetDialect).

### `DELETE /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` `{ "success": true }`.

---

## 4. Schema Generation, Validation & Persistence

### `POST /api/projects/:id/generate`
Generates or regenerates schema using Gemini 2.5 Flash from the provided requirements.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "prompt": "Build an Uber-like ride hailing application...",
    "modules": ["Users", "Drivers", "Rides", "Payments"],
    "targetDialect": "postgresql"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "schema": { ... },
      "diagnostics": {
        "isValid": true,
        "errors": [],
        "warnings": ["Table 'payments' has foreign key without index"]
      },
      "assumptions": ["Drivers can have multiple vehicles registered"],
      "unresolvedQuestions": ["Is ride pricing dynamic or fixed?"]
    }
  }
  ```

### `POST /api/projects/:id/validate`
Validates the current canonical schema against relational database rules without persisting.
- **Body**: `{ "schema": { ... } }`
- **Response**: `200 OK` with validation diagnostics.

### `PATCH /api/projects/:id/schema`
Persists manual edits made via ER Canvas or Entity Inspector.
- **Body**:
  ```json
  {
    "schema": { ... },
    "layout": { "nodes": [{ "id": "users", "x": 100, "y": 200 }] }
  }
  ```
- **Response**: `200 OK` with saved version number.

### `POST /api/projects/:id/export`
Generates formatted SQL script or Markdown documentation.
- **Body**: `{ "format": "sql" | "markdown" | "json", "dialect": "postgresql" }`
- **Response**: `200 OK` with `{ "content": "CREATE TABLE ...", "filename": "ecommerce_schema.sql" }`

---

## 5. Public Projects & Architecture Discovery

### `GET /api/projects/public`
Public endpoint returning discoverable architectures without authentication.
- **Query Parameters**:
  - `page` (default 1)
  - `limit` (default 12, max 50)
  - `search` (searches name and description)
  - `dialect` (`all` | `postgresql` | `mysql` | `sqlite`)
  - `sort` (`recent` | `clones` | `name`)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "proj_123",
          "name": "E-Commerce Microservices",
          "description": "Multi-tenant inventory and checkout architecture",
          "targetDialect": "postgresql",
          "authorName": "Alex Chen",
          "tableCount": 8,
          "relationshipCount": 11,
          "cloneCount": 42,
          "updatedAt": "2026-10-11T12:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 12,
      "totalPages": 1
    }
  }
  ```

### `GET /api/projects/public/:id`
Retrieves sanitized, read-only representation of a single published project. Returns 404 if private or unlisted.
- **Response**: `200 OK` with `PublicProjectSummary` and full canonical `schema`.

### `PATCH /api/projects/:id/visibility`
Owner-only endpoint to toggle project between `private` and `public`.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "visibility": "public" | "private" }`
- **Response**: `200 OK` `{ "success": true, "data": { "visibility": "public" } }`

---

## 6. Project Cloning & Lineage Tracking

### `POST /api/projects/:id/clone`
Clones a public or permitted project into the authenticated caller's account with complete entity and relationship ID decoupling.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "id": "proj_clone_789",
      "name": "E-Commerce Microservices (Clone)",
      "targetDialect": "postgresql",
      "cloneCount": 43
    }
  }
  ```

---

## 7. Team Collaboration & Invitations

### `GET /api/projects/:id/members`
Lists active members and pending invitations for a project. Requires project membership (`owner`, `editor`, `viewer`).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with `{ "members": [...], "pendingInvitations": [...] }`

### `POST /api/projects/:id/members/invite`
Owner-only endpoint to invite a collaborator by email.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "email": "engineer@company.com", "role": "editor" | "viewer" }`
- **Response**: `201 Created` with invitation details and optional single-use invitation link.

### `PATCH /api/projects/:id/members/:memberUserId/role`
Owner-only endpoint to change a member's role (`editor` <-> `viewer`).
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "role": "editor" | "viewer" }`
- **Response**: `200 OK`

### `DELETE /api/projects/:id/members/:memberUserId`
Owner-only endpoint to remove a collaborator from the project.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `DELETE /api/projects/:id/invitations/:invitationId`
Owner-only endpoint to revoke a pending invitation before acceptance.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `GET /api/invitations/my-invitations`
Lists pending invitations sent to the currently authenticated user's email.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with array of invitations.

### `POST /api/invitations/accept`
Accepts an invitation using single-use cryptographically secure invitation token.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "token": "<secure_token_or_id>" }`
- **Response**: `200 OK`

### `POST /api/invitations/decline`
Declines a pending project invitation.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "token": "<secure_token_or_id>" }`
- **Response**: `200 OK`

### `GET /api/collaborations`
Overview returning `sharedWithMe` (where caller is editor/viewer) and `myTeamProjects` (owned projects with members).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `POST /api/projects/:id/save-schema`
Saves schema with optimistic revision concurrency control.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "schema": { ... }, "expectedVersion": 2 }`
- **Response**:
  - `200 OK` on success with `{ "version": 3 }`
  - `409 Conflict` if server revision > `expectedVersion` with `{ "code": "SCHEMA_CONFLICT", "details": { "currentVersion": 4, "latestSchema": { ... } } }`

