# Student Result Management System

A full-stack MERN application for managing students, subjects, examinations, marks, and academic results. The system provides role-based access for administrators, teachers, and students, along with academic performance analytics and student-specific performance insights.

## Features

### Authentication and Authorization
- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control for Admin, Teacher, and Student
- Change-password page available to all signed-in roles
- Protected routes and API endpoints

### Admin Module
- Dashboard with academic statistics and grade-distribution chart
- Create, view, update, and delete student records (search/filter tables)
- Create teacher accounts and assign subjects to teachers
- Manage subjects
- Manage examinations
- Enter and update student marks
- Automatic percentage, grade, and pass/fail calculation
- View and manage examination results, including which user entered each result (`enteredBy`)
- Grade distribution of recorded results across A+, A, B, C, D, E, and F

### Teacher Module
- Dashboard with statistics scoped to the subjects assigned to the teacher
- Grade-distribution chart for own subjects
- Enter and update marks for own subjects only (subject ownership enforced server-side)
- View student roster and subject-wise class performance for own subjects

### Student Module
- Student dashboard with academic statistics
- View personal profile
- View individual examination results
- Access marks, percentages, grades, and result status
- Download results as a formatted HTML file (client-side, no server round-trip)
- Students can only access their own results

### Academic Performance Analytics
- Overall average percentage and pass rate (Admin)
- Passed and failed result counts (Admin)
- Grade distribution across A+, A, B, C, D, E, and F (Admin)
- Subject-wise average percentage, pass rate, and recorded result counts (Admin)
- Subject-level class performance for teachers (own subjects) or admins
- Student performance insights: individual average percentage, strongest subject, examination-wise trend, total passed/failed results

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Testing | Node.js native test runner, mongodb-memory-server |
| Linting | Oxlint (client) |
| Version Control | Git, GitHub |
| CI | GitHub Actions |

## Project Structure

```text
student-result-management-system/
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── navigationItems.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── tests/
│   └── utils/
├── .github/workflows/ci.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- MongoDB running locally (default `mongodb://localhost:27017`) or a MongoDB connection string
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/fariduddinahmed1/resulthub.git
cd resulthub
```

### 2. Configure the Backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and edit the values:

```bash
cp .env.example .env
```

```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/student-result-management
JWT_SECRET=your_secure_jwt_secret

ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password

CLIENT_URL=http://localhost:5173
```

Use a secure `JWT_SECRET` and admin password. Never commit your `.env` file.

### 3. Create the Admin Account

```bash
npm run create-admin
```

### Seed Demo Data (Optional)

Populate the database with a demo dataset — 1 admin, 3 teachers, 10 students, 6 subjects, 12 exams, and 108 results:

```bash
npm run seed
```

Demo credentials after seeding:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin@12345678` (or `ADMIN_PASSWORD`) |
| Teacher | `asha@college.edu`, `rahul@college.edu`, `priya@college.edu` | `Password@123` |
| Students | `aarav@student.edu` … `ananya@student.edu` (10 students) | `Password@123` |

### 4. Start the Backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:5050`

### 5. Configure the Frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Copy `client/.env.example` to `client/.env`:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5050/api
```

### 6. Start the Frontend

```bash
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## Running Tests

```bash
cd server
npm test
```

Runs unit tests for result calculation and integration tests against an in-memory MongoDB instance. Client lint and production build:

```bash
cd client
npm run lint
npm run build
```

CI (`.github/workflows/ci.yml`) runs the server test suite, client lint, and client build on every push and pull request.

## API Overview

Base URL:

`http://localhost:5050/api`

| Module | Endpoint | Access | Purpose |
|---|---|---|---|
| Authentication | `POST /auth/register` | Public | Student registration |
| Authentication | `POST /auth/login` | Public | User login |
| Authentication | `GET /auth/me` | Authenticated | Get logged-in user |
| Authentication | `PUT /auth/change-password` | Authenticated | Change own password |
| Students | `POST /students` | Admin | Create student |
| Students | `GET /students` | Admin, Teacher | List/search students |
| Students | `GET /students/:id` | Admin | View student |
| Students | `PUT /students/:id` | Admin | Update student |
| Students | `DELETE /students/:id` | Admin | Delete student |
| Subjects | `GET /subjects/my` | Teacher | Subjects assigned to the teacher |
| Subjects | `POST /subjects` | Admin | Create subject |
| Subjects | `GET /subjects` | Admin | List subjects |
| Subjects | `GET /subjects/:id` | Admin | View subject |
| Subjects | `PUT /subjects/:id` | Admin | Update subject |
| Subjects | `DELETE /subjects/:id` | Admin | Delete subject |
| Examinations | `GET /exams/my` | Teacher | Exams for own subjects |
| Examinations | `POST /exams` | Admin | Create examination |
| Examinations | `GET /exams` | Admin | List examinations |
| Examinations | `GET /exams/:id` | Admin | View examination |
| Examinations | `PUT /exams/:id` | Admin | Update examination |
| Examinations | `DELETE /exams/:id` | Admin | Delete examination |
| Results | `GET /results/my-results` | Student | View own results |
| Results | `GET /results/my-subjects` | Teacher | Results for own subjects (marks entry) |
| Results | `POST /results` | Admin, Teacher* | Create result |
| Results | `GET /results` | Admin | List all results |
| Results | `GET /results/:id` | Admin | View result |
| Results | `PUT /results/:id` | Admin, Teacher* | Update result |
| Results | `DELETE /results/:id` | Admin | Delete result |
| Analytics | `GET /analytics/overview` | Admin | Overall academic analytics |
| Analytics | `GET /analytics/subjects` | Admin | Subject-wise performance analytics |
| Analytics | `GET /analytics/subject/:id` | Admin, Teacher* | One subject's class performance |
| Analytics | `GET /analytics/student` | Student | Individual performance insights |
| Health | `GET /health` | Public | Health check |

\* Teachers may modify results only for subjects they are assigned to; ownership is enforced server-side.

Protected endpoints require a valid JWT access token. Administrative endpoints require the Admin role; teacher endpoints require the Teacher role and are scoped to assigned subjects; student-specific endpoints restrict access to the authenticated student.

## Result Calculation

The application automatically calculates:

- **Percentage:** Marks obtained divided by total marks, multiplied by 100.
- **Grade:** Assigned according to the following percentage ranges.

| Percentage | Grade |
|---|---|
| 90% and above | A+ |
| 80% – below 90% | A |
| 70% – below 80% | B |
| 60% – below 70% | C |
| 50% – below 60% | D |
| 40% – below 50% | E |
| Below 40% | F |

- **Status:** Pass or Fail based on whether marks obtained meet the examination's passing marks.

Grade and pass/fail status are calculated independently.

## Analytics Calculations

- **Average Percentage:** Average of the recorded result percentages.
- **Pass Rate:** Passed results divided by total recorded results, multiplied by 100.
- **Grade Distribution:** Number of recorded results in each grade category, shown as a CSS bar chart.
- **Subject-wise Performance:** Average percentage and pass rate calculated using recorded results for each subject.
- **Student Performance Trend:** Examination-wise percentages, grades, and result statuses displayed chronologically.

## Security and Data Integrity

- Passwords are hashed before storage.
- JWT authentication protects private routes.
- Role-based authorization restricts administrative and teacher operations.
- Teacher access to marks and analytics is scoped server-side to assigned subjects; students can access only their own results.
- Duplicate results for the same student and examination are prevented.
- Records with dependent data cannot be deleted.
- Input validation protects examination, student, and result data integrity.

## Developer

**Fariduddin Ahmed**

GitHub: https://github.com/fariduddinahmed1
