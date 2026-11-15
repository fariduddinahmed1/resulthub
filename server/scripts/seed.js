
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import calculateResult from "../utils/calculateResult.js";

dotenv.config();

// Replaces ALL data in the database with a fresh demo dataset.
const DEMO_PASSWORD = "Password@123";

// Subjects taught to both departments (students of either dept take them).
const SHARED_DEPARTMENT = "CSE & ECE";

const demoTeachers = [
  { name: "Dr Asha Rao", email: "asha@college.edu", department: "CSE" },
  { name: "Prof Rahul Menon", email: "rahul@college.edu", department: "CSE" },
  { name: "Dr Priya Nair", email: "priya@college.edu", department: "ECE" }
];

const demoStudents = [
  // CSE — 6 students
  { name: "Aarav Sharma", email: "aarav@student.edu", rollNumber: "CS202601", department: "CSE", semester: 3 },
  { name: "Diya Patel", email: "diya@student.edu", rollNumber: "CS202602", department: "CSE", semester: 3 },
  { name: "Kabir Singh", email: "kabir@student.edu", rollNumber: "CS202603", department: "CSE", semester: 3 },
  { name: "Isha Verma", email: "isha@student.edu", rollNumber: "CS202604", department: "CSE", semester: 3 },
  { name: "Rohan Gupta", email: "rohan@student.edu", rollNumber: "CS202605", department: "CSE", semester: 3 },
  { name: "Vihaan Reddy", email: "vihaan@student.edu", rollNumber: "CS202606", department: "CSE", semester: 3 },
  // ECE — 4 students
  { name: "Sara Khan", email: "sara@student.edu", rollNumber: "EC202601", department: "ECE", semester: 3 },
  { name: "Aditya Rao", email: "aditya@student.edu", rollNumber: "EC202602", department: "ECE", semester: 3 },
  { name: "Meera Nair", email: "meera@student.edu", rollNumber: "EC202603", department: "ECE", semester: 3 },
  { name: "Ananya Iyer", email: "ananya@student.edu", rollNumber: "EC202604", department: "ECE", semester: 3 }
];

// 6 subjects: 5 shared by CSE & ECE, Digital Circuits for ECE only.
// teacherIdx points into demoTeachers.
const subjectSeeds = [
  { name: "Data Structures", subjectCode: "CS201", department: SHARED_DEPARTMENT, semester: 3, credits: 4, teacherIdx: 0 },
  { name: "Operating Systems", subjectCode: "CS202", department: SHARED_DEPARTMENT, semester: 3, credits: 4, teacherIdx: 0 },
  { name: "Database Management Systems", subjectCode: "CS203", department: SHARED_DEPARTMENT, semester: 3, credits: 4, teacherIdx: 1 },
  { name: "Signal Systems", subjectCode: "EC201", department: SHARED_DEPARTMENT, semester: 3, credits: 4, teacherIdx: 2 },
  { name: "Software Engineering", subjectCode: "CS204", department: SHARED_DEPARTMENT, semester: 3, credits: 3, teacherIdx: 1 },
  { name: "Digital Circuits", subjectCode: "EC202", department: "ECE", semester: 3, credits: 3, teacherIdx: 2 }
];

const examSchedule = [
  ["Mid Semester Test", "Mid Semester", "2026-09-20"],
  ["End Semester Exam", "End Semester", "2026-11-01"]
];

const seed = async () => {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await Promise.all([
      Result.deleteMany({}),
      Exam.deleteMany({}),
      Subject.deleteMany({}),
      User.deleteMany({})
    ]);

    // Admin from .env (same credentials as scripts/createAdmin.js)
    await User.create({
      name: process.env.ADMIN_NAME || "System Administrator",
      email: (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase(),
      password: process.env.ADMIN_PASSWORD || "Admin@12345678",
      role: "admin"
    });

    // Teachers: 2 CSE, 1 ECE
    const teachers = await User.create(
      demoTeachers.map((teacher) => ({
        ...teacher,
        password: DEMO_PASSWORD,
        role: "teacher"
      }))
    );

    // Students: 6 CSE, 4 ECE
    const students = await User.create(
      demoStudents.map((student) => ({
        ...student,
        password: DEMO_PASSWORD,
        role: "student"
      }))
    );

    // Subjects
    const subjects = await Subject.create(
      subjectSeeds.map(({ teacherIdx, ...subject }) => ({
        ...subject,
        teacher: teachers[teacherIdx]._id
      }))
    );

    // Mid Semester + End Semester exam for every subject
    const examSeeds = [];
    subjects.forEach((subject) => {
      examSchedule.forEach(([label, examType, examDate]) => {
        examSeeds.push({
          title: `${subject.subjectCode} ${label}`,
          subject: subject._id,
          examType,
          academicYear: "2026-27",
          examDate,
          totalMarks: 100,
          passingMarks: 40
        });
      });
    });

    const exams = await Exam.create(examSeeds);

    // Results: every student takes shared subjects; Digital Circuits only for ECE.
    // Marks follow a fixed pattern so the demo grade chart has a spread.
    const resultSeeds = [];

    exams.forEach((exam, examIdx) => {
      const subject = subjects.find((s) => s._id.equals(exam.subject));
      const shared = subject.department === SHARED_DEPARTMENT;

      students
        .filter(
          (student) =>
            (shared || student.department === subject.department) &&
            student.semester === subject.semester
        )
        .forEach((student, studentIdx) => {
          const marks = 35 + ((studentIdx * 13 + examIdx * 17) % 61);

          resultSeeds.push({
            student: student._id,
            exam: exam._id,
            marksObtained: marks,
            enteredBy: subject.teacher,
            ...calculateResult(marks, exam.totalMarks, exam.passingMarks)
          });
        });
    });

    await Result.create(resultSeeds);

    console.log("Seed complete:");
    console.log(`  1 admin    ${process.env.ADMIN_EMAIL || "admin@example.com"}`);
    console.log(`  ${teachers.length} teachers  asha@college.edu, rahul@college.edu, priya@college.edu`);
    console.log(`  ${students.length} students  6 CSE + 4 ECE  (all password: ${DEMO_PASSWORD})`);
    console.log(`  ${subjects.length} subjects  (5 shared CSE & ECE, Digital Circuits = ECE only)`);
    console.log(`  ${exams.length} exams  (Mid Semester + End Semester per subject)`);
    console.log(`  ${resultSeeds.length} results`);
    console.log(`  admin password: ${process.env.ADMIN_PASSWORD || "Admin@12345678"}`);

  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
};

seed();
