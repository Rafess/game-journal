# GameJournal

**GameJournal** is a video game discovery and personal gaming journal platform where players can explore games, organize their gaming backlog, track their progress, and share their opinions through ratings and reviews.

This project is being built as a full-stack portfolio project, focusing on API development, database modeling, third-party integrations, and maintainable code.

## Project Status

🚧 **Work in Progress**

The backend foundation is being developed.

### Planned Features

- [x] Express API with TypeScript
- [x] MySQL database integration with Prisma ORM
- [x] Initial game database model and migration
- [x] API health check endpoint
- [ ] Search and discover games through an external video game database API
- [ ] Personal game library and backlog management
- [ ] Game progress tracking
- [ ] User ratings and reviews
- [ ] User authentication and personal profiles
- [ ] React frontend

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- MySQL

### Frontend
- React
- TypeScript
- Vite *(planned)*

### External Integrations
- RAWG Video Games Database API *(planned)*

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL Server
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/game-journal.git
cd game-journal
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Configure the database

Create a MySQL database and a dedicated user for the application.

```sql
CREATE DATABASE game_journal;
CREATE DATABASE game_journal_shadow;

CREATE USER 'gamejournal_user'@'localhost'
IDENTIFIED BY 'YOUR_PASSWORD';

GRANT ALL PRIVILEGES ON game_journal.*
TO 'gamejournal_user'@'localhost';

GRANT ALL PRIVILEGES ON game_journal_shadow.*
TO 'gamejournal_user'@'localhost';
```

Replace `YOUR_PASSWORD` with a strong password.

### 3. Configure environment variables

Navigate to the backend directory:

```bash
cd backend
```

On PowerShell, create your local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace the example credentials with your local MySQL credentials.

### 4. Install dependencies

```bash
npm install
```

### 5. Apply database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

The API will be available at:

`http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Checks whether the API is running |

### Health Check

Request:

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "message": "GameJournal API is running"
}
```

## Project Structure

```text
game-journal/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
├── .gitignore
└── README.md
```

## Goals

GameJournal is an ongoing learning and portfolio project. Its main goals are to practice full-stack development, REST API design, relational data modeling, external API consumption, and sound software engineering practices.

More features and documentation will be added as development progresses.