# Student CRUD Backend (ExpressJS + TypeScript + TypeORM + MySQL)

## Setup

1. Install MySQL server and create a database:
```sql
CREATE DATABASE db_problem5;
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=db_problem5
PORT=3000
```

3. Install dependencies:
```bash
npm install
```

4. Run in development mode:
```bash
npm run dev
```

Or build and start for production:
```bash
npm run build
npm start
```

## Database Schema

TypeORM will automatically create the `students` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto increment |
| name | VARCHAR(255) | Student name |
| age | INT | Student age |
| email | VARCHAR(255) | Student email |
| active | TINYINT(1) | Active status (default: 1) |
| deleted | TINYINT(1) | Soft delete flag (default: 0) |
| created_at | DATETIME | Created timestamp |
| updated_at | DATETIME | Updated timestamp |

## API Endpoints

- `POST /students` - Create student
- `GET /students` - List all active students
- `GET /students/:id` - Get student by ID
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Soft delete student

## Example Student Object
```json
{
  "name": "John Doe",
  "age": 20,
  "email": "john@example.com"
}
```

## Architecture

- **Controller** (`controllers/`) - Express route handlers
- **Service** (`services/`) - Business logic layer
- **Repository** (`repositories/`) - Data access layer
- **Entity** (`entities/`) - TypeORM entity definitions
- **Database** (`database/`) - TypeORM DataSource configuration

Uses **Dependency Injection** pattern with interfaces for testability and flexibility.

## Postman Collection

Import `postman_collection.json` into Postman to test all API endpoints.

## Notes
- Data is persisted in MySQL database
- Soft delete: Records are marked as deleted but not removed from database
- TypeORM `synchronize: true` automatically creates/updates tables on startup
- Requires Node.js 16+ and MySQL 5.7+ installed
