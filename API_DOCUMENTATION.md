# CareGuide Secure Note-Taking API Documentation

Base URL: `http://localhost:5000/api` (Local) or `https://secure-note-taking-backend.onrender.com/api` (Production)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "currentPage": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 1. Authentication APIs

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Rate Limit**: 30 requests / 15 minutes
- **Body**:
  ```json
  {
    "name": "Naeem",
    "email": "naeem@example.com",
    "password": "Password@123",
    "interests": ["coding", "reading"]
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "...",
        "name": "Naeem",
        "email": "naeem@example.com",
        "role": "user",
        "interests": ["coding", "reading"],
        "createdAt": "..."
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Rate Limit**: 30 requests / 15 minutes
- **Body**:
  ```json
  {
    "email": "naeem@example.com",
    "password": "Password@123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { ... },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`Bearer <token>`)
- **Response**: `200 OK`

---

## 2. Note Management APIs

### Create Note
- **Endpoint**: `POST /api/notes`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "title": "My Note",
    "content": "Secret note content"
  }
  ```
- **Response**: `201 Created`

### List User's Notes (Paginated)
- **Endpoint**: `GET /api/notes?page=1&limit=10`
- **Access**: Authenticated (returns only notes owned by the caller)
- **Response**: `200 OK` with pagination metadata

### Get Note by ID
- **Endpoint**: `GET /api/notes/:id`
- **Access**: Authenticated (Owner or Admin)
- **Response**: `200 OK` (403 if accessed by another regular user)

### Update Note
- **Endpoint**: `PUT /api/notes/:id`
- **Access**: Authenticated (Owner or Admin)
- **Body**:
  ```json
  {
    "title": "Updated Title",
    "content": "Updated Content"
  }
  ```
- **Response**: `200 OK`

### Delete Note
- **Endpoint**: `DELETE /api/notes/:id`
- **Access**: Authenticated (Owner or Admin)
- **Response**: `200 OK`

---

## 3. Public Posts Module

### Create Public Post
- **Endpoint**: `POST /api/posts`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "title": "Public Guide",
    "content": "Share with the community"
  }
  ```
- **Response**: `201 Created`

### List Public Posts (Paginated)
- **Endpoint**: `GET /api/posts?page=1&limit=10`
- **Access**: Public
- **Response**: `200 OK`

### Get Post by ID
- **Endpoint**: `GET /api/posts/:id`
- **Access**: Public
- **Response**: `200 OK`

### Update Post
- **Endpoint**: `PUT /api/posts/:id`
- **Access**: Authenticated (Author or Admin)

### Delete Post
- **Endpoint**: `DELETE /api/posts/:id`
- **Access**: Authenticated (Author or Admin)

---

## 4. Admin Management APIs
*(All endpoints require `Bearer <token>` with `role: 'admin'`)*

### Get System Dashboard Metrics
- **Endpoint**: `GET /api/admin/stats`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 12,
      "totalNotes": 45,
      "totalPosts": 8
    }
  }
  ```

### Create User by Admin
- **Endpoint**: `POST /api/admin/users`
- **Body**:
  ```json
  {
    "name": "Moderator",
    "email": "mod@example.com",
    "password": "Password@123",
    "role": "admin",
    "interests": ["moderation"]
  }
  ```
- **Response**: `201 Created`

### List All Users (Paginated)
- **Endpoint**: `GET /api/admin/users?page=1&limit=10`
- **Response**: `200 OK`

### Get User by ID
- **Endpoint**: `GET /api/admin/users/:id`
- **Response**: `200 OK`

### Update User
- **Endpoint**: `PUT /api/admin/users/:id`
- **Response**: `200 OK`

### Delete User
- **Endpoint**: `DELETE /api/admin/users/:id`
- **Safeguards**:
  - Rejects self-deletion (400 Bad Request)
  - Rejects deletion of the last remaining administrator (400 Bad Request)
  - Cascades deletion of associated notes and posts
- **Response**: `200 OK`

### List All Notes Across System (Paginated)
- **Endpoint**: `GET /api/admin/notes?page=1&limit=10`
- **Response**: `200 OK`

---

## 5. Aggregation Pipelines

### Scenario 1: Group Users by Interests
- **Endpoint**: `GET /api/admin/aggregations/users-by-interest`
- **Access**: Admin only
- **Constraint**: Exactly ONE `collection.aggregate()` call; NO `find()` or `populate()`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Users successfully grouped by interests via single aggregation pipeline",
    "data": [
      {
        "_id": "coding",
        "users": ["Naeem", "Rahim"],
        "totalUsers": 2
      },
      {
        "_id": "reading",
        "users": ["Naeem", "Karim"],
        "totalUsers": 2
      }
    ]
  }
  ```

### Scenario 2: User Posts using $lookup
- **Endpoint**: `GET /api/admin/users/:id/posts`
- **Access**: Admin only
- **Constraint**: Single aggregation pipeline with `$lookup` on User collection; NO `populate()`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "User posts retrieved successfully via single $lookup aggregation pipeline",
    "data": {
      "_id": "60c72b2f9b1d8b2badbee001",
      "name": "Naeem",
      "email": "naeem@example.com",
      "role": "user",
      "interests": ["coding", "reading"],
      "posts": [
        {
          "_id": "60c72b2f9b1d8b2badbee010",
          "title": "Laravel Tutorial",
          "content": "...",
          "createdAt": "2026-11-18T12:00:00.000Z"
        }
      ]
    }
  }
  ```
