
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

const demoStudents = [
  { name: "Aarav Sharma", email: "aarav@student.edu", rollNumber: "CS202601", department: "CSE", semester: 3 },
  { name: "Diya Patel", email: "diya@student.edu", rollNumber: "CS202602", department: "CSE", semester: 3 },
  { name: "Kabir Singh", email: "kabir@student.edu", rollNumber: "CS202603", department: "CSE", semester: 3 },
  { name: "Isha Verma", email: "isha@student.edu", rollNumber: "CS202604", department: "CSE", semester: 3 },
  { name: "Rohan Gupta", email: "rohan@student.edu", rollNumber: "CS202605", department: "CSE", semester: 3 },
  { name: "Sara Khan", email: "sara@student.edu", rollNumber: "EC202601", department: "ECE", semester: 3 },
  { name: "Aditya Rao", email: "aditya@student.edu", rollNumber: "EC202602", department: "ECE", semester: 3 },
  { name: "Meera Nair", email: "meera@student.edu", rollNumber: "EC202603", department: "ECE", semester: 3 }
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
    const admin = await User.create({
      name: process.env.ADMIN_NAME || "System Administrator",
      email: (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase(),
      password: process.env.ADMIN_PASSWORD || "Admin@12345678",
      role: "admin"
    });
    void admin;

    // Teachers
    const asha = await User.create({
      name: "Dr Asha Rao",
      email: "asha@college.edu",
      password: DEMO_PASSWORD,
      department: "CSE",
      role: "teacher"
    });

    const rahul = await User.create({
      name: "Prof Rahul Menon",
      email: "rahul@college.edu",
      password: DEMO_PASSWORD,
      department: "ECE",
      role: "teacher"
    });

    // Students
    const students = await User.create(
      demoStudents.map((student) => ({
        ...student,
        password: DEMO_PASSWORD,
        role: "student"
      }))
    );

    // Subjects (CS210 intentionally has no teacher)
    const subjects = await Subject.create([
      { name: "Data Structures", subjectCode: "CS201", department: "CSE", semester: 3, credits: 4, teacher: asha._id },
      { name: "Operating Systems", subjectCode: "CS205", department: "CSE", semester: 3, credits: 4, teacher: asha._id },
      { name: "Signals and Systems", subjectCode: "EC201", department: "ECE", semester: 3, credits: 4, teacher: rahul._id },
      { name: "Digital Circuits", subjectCode: "EC205", department: "ECE", semester: 3, credits: 3, teacher: rahul._id },
      { name: "Software Engineering", subjectCode: "CS210", department: "CSE", semester: 3, credits: 3, teacher: null }
    ]);

    // Two exams per assigned subject
    const examSeeds = [];
    subjects.forEach((subject) => {
      if (!subject.teacher) return;

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

    // Results for every student in the subject's department + semester.
    // Marks follow a fixed pattern so the demo grade chart has a spread.
    const resultSeeds = [];

    exams.forEach((exam, examIdx) => {
      const subject = subjects.find((s) => s._id.equals(exam.subject));

      students
        .filter(
          (student) =>
            student.department === subject.department &&
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
    console.log("  2 teachers asha@college.edu, rahul@college.edu");
    console.log(`  ${students.length} students  (all password: ${DEMO_PASSWORD})`);
    console.log(`  ${subjects.length} subjects, ${exams.length} exams, ${resultSeeds.length} results`);
    console.log(`  admin password: ${process.env.ADMIN_PASSWORD || "Admin@12345678"}`);

  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
};

seed();
