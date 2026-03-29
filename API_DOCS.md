# RR-Vault API Documentation

This document provides a comprehensive overview of all available API endpoints in the RR-Vault backend system.

---

## 1. App Module (Public)

### Validation
- **`POST /api/v1/validate`** 
  - **Description**: Validates cloud application credentials. Often used by the SDK to verify active linkage.
  - **Body**:
    ```json
    {
      "appId": "string",
      "apiKey": "string",
      "secretKey": "string"
    }
    ```

---

## 2. Authentication Module (`/auth`)
Handles user registration, login, token management, and password recovery.

### Public Endpoints
- **`POST /auth/register`**: Register a new user account. Requires standard registration details (email, passwords, etc.).
- **`POST /auth/login`**: Authenticate a user and receive access and refresh tokens.
- **`POST /auth/verify-email`**: Verify a user's email address using a verification token.
- **`POST /auth/resend-verification`**: Request a new email verification link.
- **`POST /auth/forgot-password`**: Request a password reset link to be sent to the user's email.
- **`POST /auth/reset-password`**: Reset password using the token provided via email.

### OAuth Endpoints
- **`GET /auth/google`**: Redirects to the Google OAuth login page.
- **`GET /auth/google/callback`**: Handles the Google OAuth callback and redirects the user to the frontend with an access token on success.

### Protected Endpoints (Requires User/Admin Role)
- **`GET /auth/profile`**: Get the currently authenticated user's profile details.
- **`POST /auth/change-password`**: Change the current user's password.
- **`POST /auth/logout`**: Invalidate the user's current session or tokens.
- **`POST /auth/refresh-token`**: Get a fresh access token using a valid refresh token.

---

## 3. Cloud Module (`/cloud`)
Handles file and cloud storage management.

### Protected Endpoints (Requires API Bearer Auth)
- **`GET /cloud`**: Get a list of all files uploaded by the authenticated user.
- **`GET /cloud/:id`**: Retrieve a specific file by its ID.

### Admin Only
- **`DELETE /cloud/:id`**: Administrators can delete a specific file by ID.

---

## 4. Secrets Module (`/secrets`)
Manages API keys, app secrets, and application identifiers for the SDK usage.

### Protected Endpoints (Requires User Role)
- **`GET /secrets/get-secret-key`**: Retrieve the active API secret details for the user.
- **`POST /secrets/generate-secret`**: Generate a new API secret key for the authenticated user.
- **`PATCH /secrets/update-secret-key`**: Cycle/Update the primary API secret key.
- **`PATCH /secrets/update-api-secret`**: Alias endpoint for updating the API secret.
  
#### App ID Management
- **`GET /secrets/get-app-ids`**: Retrieve all application IDs registered to the currently authenticated user.
- **`GET /secrets/get-app-details/:appId`**: Get detailed configuration for a specific `appId`.
- **`POST /secrets/generate-app-id`**: Generate a new application ID and name binding.
  - **Body**:
    ```json
    { "name": "string" }
    ```
- **`PATCH /secrets/delete-app-id/:appId`**: Delete (or soft delete) a specific `appId`.

---

## Authentication Mechanism
Endpoints marked as **Protected** require a valid JWT token passed in the `Authorization` header:
```
Authorization: Bearer <your_jwt_access_token>
```
