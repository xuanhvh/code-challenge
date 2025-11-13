# Real-Time Scoreboard API Specification

## Overview

This module provides a secure, real-time scoreboard system that displays the top 10 users and prevents unauthorized score manipulation. The system uses WebSocket for live updates and implements anti-cheat mechanisms to ensure score integrity.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Endpoints](#api-endpoints)
3. [WebSocket Events](#websocket-events)
4. [Data Models](#data-models)
5. [Security & Anti-Cheat](#security--anti-cheat)
6. [Flow Diagrams](#flow-diagrams)
7. [Database Schema](#database-schema)
8. [Environment Configuration](#environment-configuration)
9. [Implementation Notes](#implementation-notes)
10. [Improvements & Recommendations](#improvements--recommendations)

---

## System Architecture

### Technology Stack
- **Backend Framework**: Express.js + TypeScript
- **Database**: MySQL with TypeORM
- **Real-time Communication**: Socket.IO (WebSocket)
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis (for scoreboard caching)

### Key Components

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP/REST
       │ WebSocket
       ▼
┌─────────────────┐
│  API Gateway    │
│  (Express.js)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│  Auth  │  │ WebSocket│
│Service │  │  Server  │
└───┬────┘  └────┬─────┘
    │            │
    └─────┬──────┘
          ▼
   ┌──────────────┐
   │Score Service │
   └──────┬───────┘
          │
     ┌────┴────┐
     ▼         ▼
┌────────┐  ┌───────┐
│ MySQL  │  │ Redis │
│Database│  │ Cache │
└────────┘  └───────┘
```

---

## API Endpoints

### 1. Authentication

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "userId": "number",
  "username": "string"
}
```

---

### 2. Scoreboard

#### GET `/api/scoreboard/top10`
Retrieve the top 10 users by score.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "scoreboard": [
    {
      "rank": 1,
      "userId": 123,
      "username": "player1",
      "score": 9500,
      "lastUpdated": "2025-11-14T10:30:00Z"
    }
  ],
  "timestamp": "2025-11-14T10:30:00Z"
}
```

---

### 3. Score Update

#### POST `/api/score/update`
Update user's score after completing an action.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "actionId": "string",
  "actionType": "COMPLETE_QUEST",
  "scoreIncrease": 100,
  "timestamp": "2025-11-14T10:30:00Z",
  "signature": "hmac_signature"
}
```

**Response:**
```json
{
  "success": true,
  "newScore": 1250,
  "rank": 5,
  "message": "Score updated successfully"
}
```

**Error Response (Anti-cheat detection):**
```json
{
  "success": false,
  "error": "SUSPICIOUS_ACTIVITY",
  "message": "Action rate limit exceeded",
  "retryAfter": 30
}
```

---

## WebSocket Events

### Client → Server

#### `subscribe_scoreboard`
Subscribe to real-time scoreboard updates.

**Payload:**
```json
{
  "token": "jwt_token_string"
}
```

---

### Server → Client

#### `scoreboard_update`
Broadcast when top 10 changes.

**Payload:**
```json
{
  "type": "SCOREBOARD_UPDATE",
  "scoreboard": [
    {
      "rank": 1,
      "userId": 123,
      "username": "player1",
      "score": 9500
    }
  ],
  "timestamp": "2025-11-14T10:30:00Z"
}
```

#### `rank_changed`
Notify user when their rank changes.

**Payload:**
```json
{
  "type": "RANK_CHANGED",
  "userId": 123,
  "oldRank": 12,
  "newRank": 9,
  "score": 8900
}
```

---

## Data Models

### User Entity
```typescript
{
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  score: number;
  rank: number;
  lastActionTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  deleted: boolean;
}
```

### ScoreHistory Entity
```typescript
{
  id: number;
  userId: number;
  actionId: string;
  actionType: string;
  scoreChange: number;
  previousScore: number;
  newScore: number;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  verified: boolean;
}
```

### Action Entity
```typescript
{
  id: string;
  actionType: string;
  scoreValue: number;
  cooldownSeconds: number;
  maxPerDay: number;
  active: boolean;
}
```

---

## Security & Anti-Cheat

### 1. Authentication
- JWT tokens with expiration (1 hour)
- Refresh token mechanism
- Token stored in HTTP-only cookies (optional for web)

### 2. Request Signature
Every score update must include HMAC signature:

```typescript
signature = HMAC_SHA256(
  userId + actionId + timestamp + scoreIncrease,
  SECRET_KEY
)
```

Server validates signature before processing.

### 3. Rate Limiting
- Max 10 score updates per minute per user
- Max 100 actions per day per action type
- Exponential backoff for repeated violations

### 4. Action Validation
- Verify action exists and is active
- Check cooldown period between same action types
- Validate score increase matches action's defined value
- Timestamp must be within ±5 seconds of server time

### 5. Anomaly Detection
Track and flag suspicious patterns:
- Unusual spike in score updates
- Score updates from multiple IPs simultaneously

### 6. Audit Trail
- Log all score updates with IP, user agent, timestamp
- Maintain score history for rollback capability
- Flag suspicious activities for manual review

---

## Flow Diagrams

### Score Update Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Complete Action
     ▼
┌─────────────────┐
│ Generate Request│
│  + Signature    │
└────┬────────────┘
     │
     │ 2. POST /api/score/update
     ▼
┌─────────────────┐
│  API Gateway    │
│  - Verify JWT   │
└────┬────────────┘
     │
     │ 3. Validate Request
     ▼
┌─────────────────────┐
│  Anti-Cheat Service │
│  - Check rate limit │
│  - Verify signature │
│  - Validate action  │
└────┬────────────────┘
     │
     ├─[FAIL]─► Reject (429/403)
     │
     │ [PASS]
     │ 4. Update Score
     ▼
┌─────────────────┐
│  Score Service  │
│  - Update DB    │
│  - Recalc ranks │
└────┬────────────┘
     │
     │ 5. Update Cache
     ▼
┌─────────────────┐
│  Redis Cache    │
│  - Top 10 list  │
└────┬────────────┘
     │
     │ 6. Broadcast Event
     ▼
┌─────────────────┐
│ WebSocket Server│
│ - Notify clients│
└────┬────────────┘
     │
     │ 7. scoreboard_update
     ▼
┌──────────┐
│  Client  │
│  Update  │
│    UI    │
└──────────┘
```

### WebSocket Connection Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Connect to ws://server/scoreboard
     ▼
┌─────────────────┐
│ WebSocket Server│
└────┬────────────┘
     │
     │ 2. Emit 'subscribe_scoreboard' + JWT
     ▼
┌─────────────────┐
│ Verify JWT Token│
└────┬────────────┘
     │
     ├─[INVALID]─► Disconnect
     │
     │ [VALID]
     │ 3. Add to room
     ▼
┌─────────────────┐
│  Join Room      │
│  'scoreboard'   │
└────┬────────────┘
     │
     │ 4. Send initial data
     ▼
┌──────────┐
│  Client  │
│ Receives │
│  Top 10  │
└──────────┘
     │
     │ 5. Listen for updates
     ▼
   [Connected]
```

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  score INT DEFAULT 0,
  rank INT DEFAULT 0,
  last_action_timestamp DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active TINYINT(1) DEFAULT 1,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_score_rank (score DESC, id),
  INDEX idx_username (username)
);
```

#### `score_history`
```sql
CREATE TABLE score_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_id VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  score_change INT NOT NULL,
  previous_score INT NOT NULL,
  new_score INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_time (user_id, timestamp),
  INDEX idx_action (action_id)
);
```

#### `actions`
```sql
CREATE TABLE actions (
  id VARCHAR(100) PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  score_value INT NOT NULL,
  cooldown_seconds INT DEFAULT 0,
  max_per_day INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `rate_limits`
```sql
CREATE TABLE rate_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  count INT DEFAULT 0,
  window_start DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_action_window (user_id, action_type, window_start)
);
```

---

## Environment Configuration

### `.env` File
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=scoreboard_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=another_secret_key

# Anti-Cheat
HMAC_SECRET=hmac_signing_key
MAX_ACTIONS_PER_MINUTE=10
MAX_ACTIONS_PER_DAY=100
TIMESTAMP_TOLERANCE_SECONDS=5

# WebSocket
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000
```

---

## Implementation Notes

### 1. Caching Strategy

**Redis Cache Structure:**
```
scoreboard:top10 → JSON array of top 10 users
scoreboard:user:{userId}:rank → User's current rank
scoreboard:last_update → Timestamp of last update
```

**Cache Invalidation:**
- Update cache immediately after score change
- TTL: 60 seconds (fallback to DB if stale)

### 2. Signature Generation (Client-Side)

```typescript
// Example client-side signature generation
import CryptoJS from 'crypto-js';

function generateSignature(
  userId: number,
  actionId: string,
  timestamp: string,
  scoreIncrease: number,
  secretKey: string
): string {
  const message = `${userId}${actionId}${timestamp}${scoreIncrease}`;
  return CryptoJS.HmacSHA256(message, secretKey).toString();
}
```

---

## Improvements & Recommendations

### 1. Enhanced Security

#### Server-Side Action Verification (Recommended)
Instead of client sending score increase:
```typescript
// Client only sends action completion
POST /api/action/complete
{
  "actionId": "quest_123",
  "proof": { /* game-specific validation data */ }
}

// Server validates and calculates score internally
```

#### Multi-Factor Verification
- Validate game state before accepting score
- Check if action prerequisites are met

### 2. Performance Optimization

#### Database Indexing
```sql
-- Composite index for top 10 query
CREATE INDEX idx_score_active ON users(score DESC, deleted, active);

-- Partial index for recent actions (MySQL 8.0+)
CREATE INDEX idx_recent_actions ON score_history(user_id, timestamp)
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

### 3. Scalability

#### Asynchronous Processing
```typescript
// Use message queue (RabbitMQ/Redis) for score updates
POST /api/score/update → Queue job → Process async → Update DB → Broadcast
```

### 4. Monitoring & Analytics

#### Logging
```typescript
// Structured logging
{
  event: "SCORE_UPDATE",
  userId: 123,
  actionId: "quest_1",
  scoreChange: 100,
  newScore: 1250,
  ipAddress: "192.168.1.1",
  timestamp: "2025-11-14T10:30:00Z",
  verified: true
}
```

---

**Key Takeaways:**
- ✅ JWT authentication for user verification
- ✅ HMAC signatures for request integrity
- ✅ Multi-layer anti-cheat mechanisms
- ✅ WebSocket for real-time updates
- ✅ Redis caching for performance
