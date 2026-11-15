
import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";

const initialFormData = {
  student: "",
  exam: "",
  marksObtained: "",
};

const Results = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingResultId, setEditingResultId] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const query = search.trim().toLowerCase();
  const filteredResults = query
    ? results.filter((result) =>
        [
          result.student?.name,
          result.student?.rollNumber,
          result.exam?.title,
          result.exam?.subject?.name,
          result.exam?.subject?.subjectCode,
          result.enteredBy?.name,
          result.grade,
          result.status,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
    : results;

  // Fetch results, students and exams
  const fetchData = async () => {
    try {
      setLoading(true);

      const settled = await Promise.allSettled([
        api.get("/results"),
        api.get("/students"),
        api.get("/exams"),
      ]);

      const [resultsRes, studentsRes, examsRes] = settled;

      if (resultsRes.status === "fulfilled") {
        setResults(resultsRes.value.data.results);
      }

      if (studentsRes.status === "fulfilled") {
        setStudents(studentsRes.value.data.students);
      }

      if (examsRes.status === "fulfilled") {
        setExams(examsRes.value.data.exams);
      }

      const firstFailure = settled.find((r) => r.status === "rejected");

      if (firstFailure) {
        const err = firstFailure.reason;
        setError(
          err.response?.data?.message ||
            "Failed to fetch results data."
        );
      } else {
        setError("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch results data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Open form for editing marks
  const handleEdit = (result) => {
    setEditingResultId(result._id);

    setFormData({
      student: result.student?._id || "",
      exam: result.exam?._id || "",
      marksObtained: result.marksObtained,
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingResultId(null);
    setShowForm(false);
  };

  // Add or update result
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const resultData = {
        student: formData.student,
        exam: formData.exam,
        marksObtained: Number(formData.marksObtained),
      };

      if (editingResultId) {
        await api.put(
          `/results/${editingResultId}`,
          { marksObtained: resultData.marksObtained }
        );

        setMessage("Result updated successfully!");
      } else {
        await api.post("/results", resultData);
        setMessage("Result added successfully!");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save result."
      );
    }
  };

  // Delete result
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this result?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/results/${id}`);
      setMessage("Result deleted successfully!");
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete result."
      );
    }
  };

  return (
    <AdminLayout title="Result Management">
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Result Management</h1>
          <p>Manage student examination results.</p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingResultId(null);
              setFormData(initialFormData);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add Result"}
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="student-form" onSubmit={handleSubmit}>
          <h2>
            {editingResultId ? "Edit Result" : "Add New Result"}
          </h2>

          <label htmlFor="student">Student</label>
          <select
            id="student"
            name="student"
            value={formData.student}
            onChange={handleChange}
            required
            disabled={Boolean(editingResultId)}
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>

          <label htmlFor="exam">Exam</label>
          <select
            id="exam"
            name="exam"
            value={formData.exam}
            onChange={handleChange}
            required
            disabled={Boolean(editingResultId)}
          >
            <option value="">Select Exam</option>

            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.title} - {exam.subject?.subjectCode}
              </option>
            ))}
          </select>

          <label htmlFor="marksObtained">Marks Obtained</label>
          <input
            id="marksObtained"
            name="marksObtained"
            type="number"
            min="0"
            max={
              exams.find((exam) => exam._id === formData.exam)
                ?.totalMarks
            }
            value={formData.marksObtained}
            onChange={handleChange}
            placeholder="Enter marks obtained"
            required
          />

          <button type="submit">
            {editingResultId ? "Update Result" : "Save Result"}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      {!loading && results.length > 0 && (
        <input
          className="table-search"
          type="search"
          placeholder="Search by student, exam, subject, entered by or grade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search results"
        />
      )}

      <div className="table-container">
        {loading ? (
          <p>Loading results...</p>
        ) : results.length === 0 ? (
          <p>No results found.</p>
        ) : filteredResults.length === 0 ? (
          <p>No results match your search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Entered By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredResults.map((result) => (
                <tr key={result._id}>
                  <td>
                    {result.student?.name}
                    <br />
                    {result.student?.email}
                  </td>

                  <td>{result.exam?.title}</td>

                  <td>
                    {result.exam?.subject?.name}
                  </td>

                  <td>
                    {result.marksObtained} / {result.exam?.totalMarks}
                  </td>

                  <td>{result.percentage}%</td>
                  <td>{result.grade}</td>
                  <td>{result.status}</td>
                  <td>
                    {result.enteredBy?.name || "—"}
                    <br />
                    <span className="table-subtext">
                      {result.enteredBy?.role || ""}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(result)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(result._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default Results;
