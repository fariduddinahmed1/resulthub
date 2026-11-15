
import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";

const initialFormData = {
  name: "",
  subjectCode: "",
  department: "",
  semester: "",
  credits: "",
  teacher: "",
};

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const query = search.trim().toLowerCase();
  const filteredSubjects = query
    ? subjects.filter((subject) =>
        [
          subject.name,
          subject.subjectCode,
          subject.department,
          subject.teacher?.name,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
    : subjects;

  // Fetch all subjects and the teachers who can be assigned
  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const [subjectsRes, teachersRes] = await Promise.allSettled([
        api.get("/subjects"),
        api.get("/students?role=teacher"),
      ]);

      if (subjectsRes.status === "fulfilled") {
        setSubjects(subjectsRes.value.data.subjects);
        setError("");
      } else {
        setError(
          subjectsRes.reason.response?.data?.message ||
            "Failed to fetch subjects."
        );
      }

      if (teachersRes.status === "fulfilled") {
        setTeachers(teachersRes.value.data.students);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Open form with existing subject details
  const handleEdit = (subject) => {
    setEditingSubjectId(subject._id);

    setFormData({
      name: subject.name || "",
      subjectCode: subject.subjectCode || "",
      department: subject.department || "",
      semester: subject.semester ?? "",
      credits: subject.credits ?? "",
      teacher: subject.teacher?._id || "",
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingSubjectId(null);
    setShowForm(false);
  };

  // Add or update subject
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const subjectData = {
        ...formData,
        semester: Number(formData.semester),
        credits: Number(formData.credits),
        teacher: formData.teacher || null,
      };

      if (editingSubjectId) {
        await api.put(
          `/subjects/${editingSubjectId}`,
          subjectData
        );
        setMessage("Subject updated successfully!");
      } else {
        await api.post("/subjects", subjectData);
        setMessage("Subject added successfully!");
      }

      resetForm();
      await fetchSubjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingSubjectId
            ? "Failed to update subject."
            : "Failed to add subject.")
      );
    }
  };

  // Delete subject
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/subjects/${id}`);
      setMessage("Subject deleted successfully!");
      await fetchSubjects();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete subject."
      );
    }
  };

  return (
    <AdminLayout title="Subject Management">
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Subject Management</h1>
          <p>View and manage academic subjects.</p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingSubjectId(null);
              setFormData(initialFormData);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add Subject"}
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="student-form" onSubmit={handleSubmit}>
          <h2>
            {editingSubjectId ? "Edit Subject" : "Add New Subject"}
          </h2>

          <input
            name="name"
            placeholder="Subject Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="subjectCode"
            placeholder="Subject Code"
            value={formData.subjectCode}
            onChange={handleChange}
            required
          />

          <input
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            required
          />

          <input
            name="semester"
            type="number"
            placeholder="Semester (1-8)"
            min="1"
            max="8"
            value={formData.semester}
            onChange={handleChange}
            required
          />

          <input
            name="credits"
            type="number"
            placeholder="Credits (1-10)"
            min="1"
            max="10"
            value={formData.credits}
            onChange={handleChange}
            required
          />

          <select
            name="teacher"
            value={formData.teacher}
            onChange={handleChange}
            aria-label="Assigned teacher"
          >
            <option value="">No teacher assigned</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>

          <button type="submit">
            {editingSubjectId ? "Update Subject" : "Save Subject"}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      {!loading && subjects.length > 0 && (
        <input
          className="table-search"
          type="search"
          placeholder="Search by subject name, code, department or teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search subjects"
        />
      )}

      <div className="table-container">
        {loading ? (
          <p>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p>No subjects found.</p>
        ) : filteredSubjects.length === 0 ? (
          <p>No subjects match your search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject._id}>
                  <td>{subject.name}</td>
                  <td>{subject.subjectCode}</td>
                  <td>{subject.department}</td>
                  <td>{subject.semester}</td>
                  <td>{subject.credits}</td>
                  <td>{subject.teacher?.name || "—"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(subject)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(subject._id)}
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

export default Subjects;
