
import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";

const initialFormData = {
  name: "",
  email: "",
  password: "",
  rollNumber: "",
  department: "",
  semester: "",
  role: "student",
};

// Shared page for both admin sections: /admin/students (role="student")
// and /admin/teachers (role="teacher").
const Students = ({ role = "student" }) => {
  const isTeacher = role === "teacher";
  const noun = isTeacher ? "Teacher" : "Student";
  const nounLower = noun.toLowerCase();

  const emptyForm = { ...initialFormData, role };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState(emptyForm);

  const query = search.trim().toLowerCase();
  const filteredStudents = query
    ? students.filter((student) =>
        [student.name, student.email, student.rollNumber, student.department]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
    : students;

  // Fetch records for this section only (?role=student / ?role=teacher)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/students?role=${role}`);
      setStudents(response.data.students);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to fetch ${nounLower}s.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Open form with existing student details
  const handleEdit = (student) => {
    setEditingStudentId(student._id);

    setFormData({
      name: student.name || "",
      email: student.email || "",
      password: "",
      rollNumber: student.rollNumber || "",
      department: student.department || "",
      semester: student.semester ?? "",
      role: student.role || "student",
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingStudentId(null);
    setShowForm(false);
  };

  // Add or update student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // Teachers have no roll number or semester
      const studentData = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        ...(formData.role === "student" && {
          rollNumber: formData.rollNumber,
          semester: Number(formData.semester),
        }),
      };

      if (editingStudentId) {
        // Update existing record
        await api.put(
          `/students/${editingStudentId}`,
          studentData
        );

        setMessage(`${noun} updated successfully!`);
      } else {
        // Add new record
        await api.post("/students", {
          ...studentData,
          password: formData.password,
        });

        setMessage(`${noun} added successfully!`);
      }

      resetForm();
      await fetchStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingStudentId
            ? `Failed to update ${nounLower}.`
            : `Failed to add ${nounLower}.`)
      );
    }
  };

  // Delete record
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${nounLower}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/students/${id}`);
      setMessage(`${noun} deleted successfully!`);
      await fetchStudents();
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to delete ${nounLower}.`
      );
    }
  };

  return (
    <AdminLayout title={`${noun} Management`}>
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{noun} Management</h1>
          <p>View and manage {nounLower} records.</p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingStudentId(null);
              setFormData(emptyForm);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add Record"}
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="student-form" onSubmit={handleSubmit}>
          <h2>
            {editingStudentId ? `Edit ${noun}` : `Add New ${noun}`}
          </h2>

          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {!editingStudentId && (
            <input
              name="password"
              type="password"
              placeholder="Temporary Password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          )}

          <input
            name="rollNumber"
            placeholder="Roll Number"
            value={formData.rollNumber}
            onChange={handleChange}
            required={!isTeacher}
            hidden={isTeacher}
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
            required={!isTeacher}
            hidden={isTeacher}
          />

          <button type="submit">
            {editingStudentId ? `Update ${noun}` : `Save ${noun}`}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      {!loading && students.length > 0 && (
        <input
          className="table-search"
          type="search"
          placeholder={
            isTeacher
              ? "Search by name, email or department..."
              : "Search by name, email, roll number or department..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${nounLower}s`}
        />
      )}

      <div className="table-container">
        {loading ? (
          <p>Loading {nounLower}s...</p>
        ) : students.length === 0 ? (
          <p>No {nounLower}s found.</p>
        ) : filteredStudents.length === 0 ? (
          <p>No {nounLower}s match your search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                {!isTeacher && <th>Roll Number</th>}
                {!isTeacher && <th>Semester</th>}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.department || "—"}</td>
                  {!isTeacher && <td>{student.rollNumber || "—"}</td>}
                  {!isTeacher && <td>{student.semester ?? "—"}</td>}
                  <td>
                    <button
                      type="button"
                      onClick={() => handleEdit(student)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(student._id)}
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

export default Students;
