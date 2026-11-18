# MongoDB Aggregation Pipelines

This document provides a detailed breakdown of the two mandatory MongoDB Aggregation Scenarios required by the CareGuide Technical Interview Assignment.

---

## SCENARIO 1: Group Users by Interests

### 1. Context & Business Requirement
User profiles in the system store an array of interests:
```json
{
  "_id": "60c72b2f9b1d8b2badbee001",
  "name": "Naeem",
  "email": "naeem@example.com",
  "interests": ["coding", "reading"]
}
```

The system requires an administrative endpoint returning users grouped by their shared interests:
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

### 2. Critical Constraints
- **Constraint**: Must use **exactly ONE** `collection.aggregate()` call (`User.aggregate(...)`).
- **Constraint**: Do **NOT** use `find()`, `findOne()`, `populate()`, or in-memory JavaScript loops/maps to assemble the groups.
- **Constraint**: Handle users with empty arrays or missing interests gracefully.

### 3. Pipeline Implementation & Stage-by-Stage Breakdown

```javascript
const pipeline = [
  // STAGE 1: Filter documents that have a non-empty interests array
  {
    $match: {
      interests: { $exists: true, $type: 'array', $ne: [] }
    }
  },

  // STAGE 2: Unwind the array of interests
  // Transforms 1 document with N interests into N individual documents
  {
    $unwind: '$interests'
  },

  // STAGE 3: Filter out any invalid, null, or empty string interest items
  {
    $match: {
      interests: { $type: 'string', $nin: ['', null] }
    }
  },

  // STAGE 4: Group documents by interest name
  // Accumulate distinct user names using $addToSet
  {
    $group: {
      _id: '$interests',
      users: { $addToSet: '$name' }
    }
  },

  // STAGE 5: Project the final response schema
  // Shape the output with _id, users array, and accurate totalUsers count
  {
    $project: {
      _id: 1,
      users: 1,
      totalUsers: { $size: '$users' }
    }
  },

  // STAGE 6: Sort results
  // Highest participant counts first, then alphabetically by interest
  {
    $sort: {
      totalUsers: -1,
      _id: 1
    }
  }
];

const results = await User.aggregate(pipeline);
```

### 4. Verification in Test Suite
In `tests/aggregation.test.js`, we spy on `User.aggregate`, `User.find`, and `User.findOne`:
- `User.aggregate` call count: **1**
- `User.find` call count: **0**
- `User.findOne` call count: **0**

---

## SCENARIO 2: User Posts using `$lookup`

### 1. Context & Business Requirement
Posts are stored in a separate collection (`posts`) referenced to the author via `userId`:
```json
{
  "_id": "60c72b2f9b1d8b2badbee010",
  "title": "Laravel Tutorial",
  "content": "Building APIs with Laravel",
  "userId": "60c72b2f9b1d8b2badbee001"
}
```

The system requires an administrative endpoint `GET /api/admin/users/:id/posts` that retrieves a specific user and all of their posts using a single aggregation pipeline with `$lookup`.

Expected response structure:
```json
{
  "success": true,
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
        "content": "Building APIs with Laravel",
        "createdAt": "2026-11-18T12:00:00.000Z"
      }
    ]
  }
}
```

### 2. Critical Constraints
- **Constraint**: Must use a single aggregation pipeline with a `$lookup` stage.
- **Constraint**: The starting collection must be the **Users collection** (`User.aggregate(...)`).
- **Constraint**: Join the `posts` collection using `localField: "_id"` and `foreignField: "userId"`.
- **Constraint**: Do **NOT** use `populate()`.
- **Constraint**: Do **NOT** execute separate `find()` queries to merge users and posts.

### 3. Pipeline Implementation & Stage-by-Stage Breakdown

```javascript
const pipeline = [
  // STAGE 1: Match the target user by _id
  {
    $match: {
      _id: new mongoose.Types.ObjectId(userId)
    }
  },

  // STAGE 2: Perform left outer join with the 'posts' collection
  {
    $lookup: {
      from: 'posts',           // MongoDB collection name for Post model
      localField: '_id',       // User._id
      foreignField: 'userId',  // Post.userId
      as: 'posts'              // Output array field name
    }
  },

  // STAGE 3: Project the exact fields, omitting sensitive attributes (password)
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      interests: 1,
      createdAt: 1,
      posts: {
        $map: {
          input: '$posts',
          as: 'post',
          in: {
            _id: '$$post._id',
            title: '$$post.title',
            content: '$$post.content',
            createdAt: '$$post.createdAt'
          }
        }
      }
    }
  }
];

const results = await User.aggregate(pipeline);
```

### 4. Supporting Index
The `$lookup` operation is supported by the compound index on the `posts` collection:
```javascript
postSchema.index({ userId: 1, createdAt: -1 });
```
This ensures MongoDB conducts an indexed search on `foreignField: "userId"` rather than scanning the entire `posts` collection for each join operation.
