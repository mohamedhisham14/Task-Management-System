import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5001/api";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch {
      localStorage.removeItem("token");
      setPage("login");
    }
  };

  useEffect(() => {
    if (token) {
      setPage("dashboard");
      loadTasks();
    }
  }, []);

  const register = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API}/auth/register`, form);
      alert("Registration successful. Please login.");
      setPage("login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const login = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await axios.post(`${API}/auth/login`, {
      email: form.email,
      password: form.password,
    });

    const newToken = res.data.token;

    localStorage.setItem("token", newToken);
    setUser(res.data.user);
    setPage("dashboard");

    const tasksRes = await axios.get(`${API}/tasks`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    });

    setTasks(tasksRes.data);
  } catch (err) {
    setError(err.response?.data?.message || "Login failed");
  }
};

  const saveTask = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/tasks/${editing}`, taskForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/tasks`, taskForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setTaskForm({ title: "", description: "" });
      setEditing(null);
      loadTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Could not save task");
    }
  };

  const toggleTask = async (task) => {
  try {
    await axios.put(
      `${API}/tasks/${task.id}`,
      {
        title: task.title,
        description: task.description,
        status: task.status === "completed" ? "pending" : "completed",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    loadTasks();
  } catch (err) {
    alert("Could not update task");
  }
};

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await axios.delete(`${API}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    loadTasks();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setTasks([]);
    setPage("login");
  };

  if (page === "login" || page === "register") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>TaskFlow</h1>
          <p className="subtitle">Task Management System</p>

          <form onSubmit={page === "login" ? login : register}>
            {page === "register" && (
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && <div className="error">{error}</div>}

            <button type="submit">
              {page === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <button
            className="link-button"
            onClick={() => {
              setError("");
              setPage(page === "login" ? "register" : "login");
            }}
          >
            {page === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <div>
          <h1>TaskFlow</h1>
          <span>Task Management System</span>
        </div>
        <button className="logout" onClick={logout}>Logout</button>
      </header>

      <main>
        <section className="welcome">
          <div>
            <h2>My Tasks</h2>
            <p>Organize your work and stay productive.</p>
          </div>
          <span className="count">{tasks.length} tasks</span>
        </section>

        <form className="task-form" onSubmit={saveTask}>
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm({ ...taskForm, title: e.target.value })
            }
            required
          />
          <input
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm({ ...taskForm, description: e.target.value })
            }
          />
          <button type="submit">{editing ? "Update" : "Add Task"}</button>
          {editing && (
            <button
              type="button"
              className="cancel"
              onClick={() => {
                setEditing(null);
                setTaskForm({ title: "", description: "" });
              }}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty">No tasks yet. Add your first task!</div>
          ) : (
            tasks.map((task) => (
              <div className="task-card" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description || "No description"}</p>
                  <span className="status">{task.status}</span>
                </div>

                <div className="actions">
                  <button
                    onClick={() => {
                      setEditing(task.id);
                      setTaskForm({
                        title: task.title,
                        description: task.description || "",
                      });
                    }}
                  >
                    Edit
                  </button>
		  <button
  className="complete"
  onClick={() => toggleTask(task)}
>
  {task.status === "completed" ? "↩ Pending" : "✓ Complete"}
</button>


                  <button
                    className="delete"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;