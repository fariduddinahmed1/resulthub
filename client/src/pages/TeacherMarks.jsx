import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import { teacherNavigationItems } from "../navigationItems";

const TeacherMarks = () => {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [draft, setDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get("/subjects/my"),
      api.get("/exams/my"),
      api.get("/students?role=student"),
      api.get("/results/my-subjects"),
    ]).then(([subjectsRes, examsRes, studentsRes, resultsRes]) => {
      if (cancelled) return;

      if (subjectsRes.status === "fulfilled") {
        setSubjects(subjectsRes.value.data.subjects);
      }

      if (examsRes.status === "fulfilled") {
        setExams(examsRes.value.data.exams);
      }

      if (studentsRes.status === "fulfilled") {
        setStudents(
          studentsRes.value.data.students.filter((s) => s.role === "student")
        );
      }

      if (resultsRes.status === "fulfilled") {
        setResults(resultsRes.value.data.results);
      }

      const firstFailure = [
        subjectsRes,
        examsRes,
        studentsRes,
        resultsRes,
      ].find((r) => r.status === "rejected");

      if (firstFailure) {
        setError(
          firstFailure.reason.response?.data?.message ||
            "Some marks entry data could not be loaded."
        );
      } else {
        setError("");
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const subjectExams = exams.filter(
    (exam) => exam.subject?._id === selectedSubject
  );

  const selectedExamData = exams.find((exam) => exam._id === selectedExam);

  const examResults = results.filter(
    (result) => result.exam?._id === selectedExam
  );

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedExam("");
    setDraft({});
    setMessage("");
    setError("");
  };

  // Prefill existing marks when an exam is picked
  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setError("");
    setMessage("");

    const prefill = {};
    results
      .filter((result) => result.exam?._id === examId)
      .forEach((result) => {
        prefill[result.student._id] = String(result.marksObtained);
      });
    setDraft(prefill);
  };

  const handleSave = async (student) => {
    setError("");
    setMessage("");

    const raw = draft[student._id];

    if (raw === undefined || raw === "") {
      setError(`Enter marks for ${student.name} first.`);
      return;
    }

    const marks = Number(raw);

    if (
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > selectedExamData.totalMarks
    ) {
      setError(
        `Marks must be between 0 and ${selectedExamData.totalMarks}.`
      );
      return;
    }

    const existing = examResults.find(
      (result) => result.student._id === student._id
    );

    setSavingId(student._id);

    try {
      if (existing) {
        await api.put(`/results/${existing._id}`, { marksObtained: marks });
      } else {
        await api.post("/results", {
          student: student._id,
          exam: selectedExam,
          marksObtained: marks,
        });
      }

      setMessage(`Marks saved for ${student.name}.`);

      // Refetch so grades, status and pass counts are recalculated
      const response = await api.get("/results/my-subjects");
      setResults(response.data.results);
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to save marks for ${student.name}.`
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout
      title="Enter Marks"
      sectionLabel="TEACHER PORTAL"
      navItems={teacherNavigationItems}
    >
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Enter Marks</h1>
            <p>Record student marks for your subjects.</p>
          </div>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {loading && <p>Loading...</p>}

        {!loading && subjects.length === 0 && (
          <div className="student-empty-state">
            <h3>No Subjects Assigned</h3>
            <p>Ask an administrator to assign subjects to you.</p>
          </div>
        )}

        {!loading && subjects.length > 0 && (
          <>
            <div className="marks-filters">
              <select
                className="filter-select"
                value={selectedSubject}
                onChange={handleSubjectChange}
                aria-label="Select subject"
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.subjectCode})
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={selectedExam}
                onChange={handleExamChange}
                disabled={!selectedSubject}
                aria-label="Select exam"
              >
                <option value="">
                  {selectedSubject ? "Select an exam..." : "Pick a subject first"}
                </option>
                {subjectExams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} — {exam.examType}
                  </option>
                ))}
              </select>
            </div>

            {selectedSubject && subjectExams.length === 0 && (
              <p style={{ marginTop: "16px" }}>
                No exams have been created for this subject yet.
              </p>
            )}

            {selectedExamData && (
              <>
                <div className="student-stats">
                  <div className="student-stat-card">
                    <span>Exam</span>
                    <h3 style={{ fontSize: "16px" }}>
                      {selectedExamData.title}
                    </h3>
                  </div>

                  <div className="student-stat-card">
                    <span>Total Marks</span>
                    <h3>{selectedExamData.totalMarks}</h3>
                  </div>

                  <div className="student-stat-card">
                    <span>Passing Marks</span>
                    <h3>{selectedExamData.passingMarks}</h3>
                  </div>

                  <div className="student-stat-card">
                    <span>Entered</span>
                    <h3>
                      {examResults.length} / {students.length}
                    </h3>
                  </div>
                </div>

                {students.length === 0 ? (
                  <p style={{ marginTop: "16px" }}>
                    No students found to enter marks for.
                  </p>
                ) : (
                  <div className="table-container" style={{ marginTop: "24px" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Roll Number</th>
                          <th>Marks (0-{selectedExamData.totalMarks})</th>
                          <th>Current Result</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const existing = examResults.find(
                            (result) => result.student._id === student._id
                          );

                          return (
                            <tr key={student._id}>
                              <td>{student.name}</td>
                              <td>{student.rollNumber || "—"}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedExamData.totalMarks}
                                  step="1"
                                  value={draft[student._id] ?? ""}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      [student._id]: e.target.value,
                                    })
                                  }
                                  aria-label={`Marks for ${student.name}`}
                                />
                              </td>
                              <td>
                                {existing ? (
                                  <span
                                    className={`result-status ${
                                      existing.status === "Pass"
                                        ? "pass"
                                        : "fail"
                                    }`}
                                  >
                                    {existing.marksObtained} — {existing.grade} (
                                    {existing.status})
                                  </span>
                                ) : (
                                  "Not entered"
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleSave(student)}
                                  disabled={savingId === student._id}
                                >
                                  {savingId === student._id
                                    ? "Saving..."
                                    : existing
                                      ? "Update"
                                      : "Save"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default TeacherMarks;
