// API integration tests: real Express app + ephemeral in-memory MongoDB.
// Uses Node's built-in test runner and fetch — no extra dependencies.
//
// Run: npm test (from the server directory)

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Must be set before app.js is imported (dotenv will not override them)
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { MongoMemoryServer } = await import("mongodb-memory-server");
const { default: mongoose } = await import("mongoose");
const { default: app } = await import("../app.js");
const { default: User } = await import("../models/User.js");
const { default: Subject } = await import("../models/Subject.js");
const { default: Exam } = await import("../models/Exam.js");

let mongod;
let server;
let baseUrl;

// Data ids used across tests
let adminToken;
let teacherToken;
let studentToken;
let ownSubjectId;
let ownExamId;
let foreignExamId;
let studentId;

const login = async (email, password) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return { status: response.status, token: data.token, data };
};

const request = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (should not happen — the API always answers JSON)
  }

  return { status: response.status, data };
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("srm-test"));

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Seed a minimal world: admin, teacher, student, one subject per teacher
  const [admin, teacher, student] = await User.create([
    {
      name: "Test Admin",
      email: "admin@test.com",
      password: "Admin@12345678",
      role: "admin",
    },
    {
      name: "Test Teacher",
      email: "teacher@test.com",
      password: "Teacher@1234",
      department: "CSE",
      role: "teacher",
    },
    {
      name: "Test Student",
      email: "student@test.com",
      password: "Student@1234",
      rollNumber: "CS001",
      department: "CSE",
      semester: 3,
      role: "student",
    },
  ]);
  void admin;

  const [ownSubject, foreignSubject] = await Subject.create([
    {
      name: "Data Structures",
      subjectCode: "CS201",
      department: "CSE",
      semester: 3,
      credits: 4,
      teacher: teacher._id,
    },
    {
      name: "Operating Systems",
      subjectCode: "CS205",
      department: "CSE",
      semester: 3,
      credits: 4,
      teacher: null,
    },
  ]);

  const [ownExam, foreignExam] = await Exam.create([
    {
      title: "CS201 Mid Sem",
      subject: ownSubject._id,
      examType: "Mid Semester",
      academicYear: "2026-27",
      examDate: "2026-10-10",
      totalMarks: 100,
      passingMarks: 40,
    },
    {
      title: "CS205 Mid Sem",
      subject: foreignSubject._id,
      examType: "Mid Semester",
      academicYear: "2026-27",
      examDate: "2026-10-11",
      totalMarks: 100,
      passingMarks: 40,
    },
  ]);

  ownSubjectId = ownSubject._id.toString();
  ownExamId = ownExam._id.toString();
  foreignExamId = foreignExam._id.toString();
  studentId = student._id.toString();

  adminToken = (await login("admin@test.com", "Admin@12345678")).token;
  teacherToken = (await login("teacher@test.com", "Teacher@1234")).token;
  studentToken = (await login("student@test.com", "Student@1234")).token;

  assert.ok(adminToken, "admin login must return a token");
  assert.ok(teacherToken, "teacher login must return a token");
  assert.ok(studentToken, "student login must return a token");
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

test("GET /api/health returns 200", async () => {
  const { status } = await request("GET", "/health");
  assert.equal(status, 200);
});

test("login: correct credentials return a token, wrong ones 401", async () => {
  const good = await login("admin@test.com", "Admin@12345678");
  assert.equal(good.status, 200);
  assert.ok(good.token);

  const bad = await login("admin@test.com", "wrong-password");
  assert.equal(bad.status, 401);
});

test("student is denied admin routes (403)", async () => {
  for (const path of ["/students", "/subjects", "/exams", "/results", "/analytics/overview"]) {
    const { status } = await request("GET", path, { token: studentToken });
    assert.equal(status, 403, `student GET ${path} must be 403`);
  }
});

test("teacher is denied admin-only routes (403)", async () => {
  for (const path of ["/subjects", "/exams", "/analytics/overview"]) {
    const { status } = await request("GET", path, { token: teacherToken });
    assert.equal(status, 403, `teacher GET ${path} must be 403`);
  }

  const create = await request("POST", "/students", {
    token: teacherToken,
    body: {},
  });
  assert.equal(create.status, 403);
});

test("unauthenticated requests get 401", async () => {
  const { status } = await request("GET", "/students");
  assert.equal(status, 401);
});

test("teacher sees only their own subjects and exams", async () => {
  const subjects = await request("GET", "/subjects/my", { token: teacherToken });
  assert.equal(subjects.status, 200);
  assert.equal(subjects.data.count, 1);
  assert.equal(subjects.data.subjects[0].subjectCode, "CS201");

  const exams = await request("GET", "/exams/my", { token: teacherToken });
  assert.equal(exams.status, 200);
  assert.equal(exams.data.count, 1);
  assert.equal(exams.data.exams[0]._id, ownExamId);
});

test("teacher can enter marks on own subject but not a foreign one", async () => {
  const allowed = await request("POST", "/results", {
    token: teacherToken,
    body: { student: studentId, exam: ownExamId, marksObtained: 85 },
  });
  assert.equal(allowed.status, 201);
  assert.equal(allowed.data.result.percentage, 85);
  assert.equal(allowed.data.result.grade, "A");

  const denied = await request("POST", "/results", {
    token: teacherToken,
    body: { student: studentId, exam: foreignExamId, marksObtained: 85 },
  });
  assert.equal(denied.status, 403);
});

test("teacher can read but not write other subjects' analytics", async () => {
  const own = await request("GET", `/analytics/subject/${ownSubjectId}`, {
    token: teacherToken,
  });
  assert.equal(own.status, 200);
  assert.equal(own.data.analytics.totalResults, 1);

  const foreignSubject = await Subject.findOne({ teacher: null });
  const denied = await request("GET", `/analytics/subject/${foreignSubject._id}`, {
    token: teacherToken,
  });
  assert.equal(denied.status, 403);
});

test("student only sees their own results", async () => {
  const mine = await request("GET", "/results/my-results", { token: studentToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.data.count, 1);
  assert.equal(mine.data.results[0].student._id, studentId);

  const all = await request("GET", "/results", { token: studentToken });
  assert.equal(all.status, 403);
});

test("change-password: wrong current 401, short new 400, valid 200", async () => {
  const wrong = await request("PUT", "/auth/change-password", {
    token: studentToken,
    body: { currentPassword: "nope", newPassword: "NewPass@123456" },
  });
  assert.equal(wrong.status, 401);

  const short = await request("PUT", "/auth/change-password", {
    token: studentToken,
    body: { currentPassword: "Student@1234", newPassword: "short" },
  });
  assert.equal(short.status, 400);

  const valid = await request("PUT", "/auth/change-password", {
    token: studentToken,
    body: { currentPassword: "Student@1234", newPassword: "NewPass@123456" },
  });
  assert.equal(valid.status, 200);

  // Old password no longer works, new one does
  const oldLogin = await login("student@test.com", "Student@1234");
  assert.equal(oldLogin.status, 401);

  const newLogin = await login("student@test.com", "NewPass@123456");
  assert.equal(newLogin.status, 200);
});

test("malformed JSON body returns 400, not a crash", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.success, false);
});

test("unknown API route returns JSON 404", async () => {
  const { status, data } = await request("GET", "/no-such-route");
  assert.equal(status, 404);
  assert.equal(data.success, false);
});
