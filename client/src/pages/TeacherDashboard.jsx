import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import GradeChart from "../components/GradeChart";
import { teacherNavigationItems } from "../navigationItems";

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Class performance for the selected subject.
  // subjectId records which subject the data belongs to, so stale data
  // from a previous selection is never displayed.
  const [selectedSubject, setSelectedSubject] = useState("");
  const [perf, setPerf] = useState({
    subjectId: null,
    data: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get("/subjects/my"),
      api.get("/exams/my"),
      api.get("/results/my-subjects"),
    ]).then(([subjectsRes, examsRes, resultsRes]) => {
      if (cancelled) return;

      if (subjectsRes.status === "fulfilled") {
        setSubjects(subjectsRes.value.data.subjects);
      }

      if (examsRes.status === "fulfilled") {
        setExams(examsRes.value.data.exams);
      }

      if (resultsRes.status === "fulfilled") {
        setResults(resultsRes.value.data.results);
      }

      const firstFailure = [subjectsRes, examsRes, resultsRes].find(
        (r) => r.status === "rejected"
      );

      if (firstFailure) {
        setError(
          firstFailure.reason.response?.data?.message ||
            "Some teaching data could not be loaded."
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

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }

    let cancelled = false;

    api
      .get(`/analytics/subject/${selectedSubject}`)
      .then((response) => {
        if (!cancelled) {
          setPerf({
            subjectId: selectedSubject,
            data: response.data,
            error: "",
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPerf({
            subjectId: selectedSubject,
            data: null,
            error:
              err.response?.data?.message ||
              "Failed to fetch class performance.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSubject]);

  const passedResults = results.filter((r) => r.status === "Pass").length;
  const passRate = results.length
    ? Math.round((passedResults / results.length) * 100)
    : 0;

  const perfLoading =
    selectedSubject && perf.subjectId !== selectedSubject;

  return (
    <AdminLayout
      title="Teacher Dashboard"
      sectionLabel="TEACHER PORTAL"
      navItems={teacherNavigationItems}
    >
      <div className="page-container">
        <section className="welcome-section">
          <div>
            <h1>Welcome back, {user?.name}!</h1>
            <p>Your subjects, marks and class performance.</p>
          </div>

          <span className="admin-status">
            <span className="status-dot"></span>
            Teacher Account
          </span>
        </section>

        {loading && <p>Loading your teaching data...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && (
          <>
            <section className="student-stats">
              <div className="student-stat-card">
                <span>My Subjects</span>
                <h3>{subjects.length}</h3>
              </div>

              <div className="student-stat-card">
                <span>My Exams</span>
                <h3>{exams.length}</h3>
              </div>

              <div className="student-stat-card">
                <span>Marks Entered</span>
                <h3>{results.length}</h3>
              </div>

              <div className="student-stat-card">
                <span>Pass Rate</span>
                <h3 className="pass-number">{passRate}%</h3>
              </div>
            </section>

            <section className="student-results-section">
              <div className="section-heading">
                <h2>My Subjects</h2>
                <p>Subjects assigned to you</p>
              </div>

              {subjects.length === 0 ? (
                <div className="student-empty-state">
                  <h3>No Subjects Assigned</h3>
                  <p>Ask an administrator to assign subjects to you.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Subject Code</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr key={subject._id}>
                          <td>{subject.name}</td>
                          <td>{subject.subjectCode}</td>
                          <td>{subject.department}</td>
                          <td>{subject.semester}</td>
                          <td>{subject.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="student-results-section">
              <div className="section-heading">
                <h2>Class Performance</h2>
                <p>How your students are performing</p>
              </div>

              {subjects.length > 0 && (
                <select
                  className="filter-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  aria-label="Select subject"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.subjectCode})
                    </option>
                  ))}
                </select>
              )}

              {!selectedSubject && (
                <p style={{ marginTop: "16px" }}>
                  Choose a subject to see its performance.
                </p>
              )}

              {perfLoading && <p>Loading performance...</p>}

              {!perfLoading && selectedSubject && perf.error && (
                <p className="error-message">{perf.error}</p>
              )}

              {!perfLoading && !perf.error && perf.data && (
                <>
                  <div className="student-stats">
                    <div className="student-stat-card">
                      <span>Average</span>
                      <h3>{perf.data.analytics.averagePercentage}%</h3>
                    </div>

                    <div className="student-stat-card">
                      <span>Pass Rate</span>
                      <h3 className="pass-number">
                        {perf.data.analytics.passRate}%
                      </h3>
                    </div>

                    <div className="student-stat-card">
                      <span>Results</span>
                      <h3>{perf.data.analytics.totalResults}</h3>
                    </div>

                    <div className="student-stat-card">
                      <span>Failed</span>
                      <h3 className="fail-number">
                        {perf.data.analytics.failedResults}
                      </h3>
                    </div>
                  </div>

                  <div className="section-heading" style={{ marginTop: "28px" }}>
                    <h2>Grade Distribution</h2>
                    <p>{perf.data.subject.subjectCode} — all recorded results</p>
                  </div>

                  <GradeChart distribution={perf.data.analytics.gradeDistribution} />

                  <div className="section-heading" style={{ marginTop: "28px" }}>
                    <h2>Exam Breakdown</h2>
                    <p>Performance per examination</p>
                  </div>

                  {perf.data.analytics.exams.length === 0 ? (
                    <p>No results recorded for this subject yet.</p>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Exam</th>
                            <th>Type</th>
                            <th>Results</th>
                            <th>Average</th>
                            <th>Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perf.data.analytics.exams.map((exam) => (
                            <tr key={exam._id}>
                              <td>{exam.title}</td>
                              <td>{exam.examType}</td>
                              <td>{exam.totalResults}</td>
                              <td>{exam.averagePercentage}%</td>
                              <td>{exam.passRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default TeacherDashboard;
