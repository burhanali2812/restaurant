import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./WaiterManage.css";

function WaiterManage() {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const initialForm = {
    name: "",
    phone: "",
    salary: "",
    shift: "Morning",
    isActive: true,
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const restaurantId =
    storedUser?.restaurantId?._id || storedUser?.restaurantId || null;

  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleOpenModal = () => {
    console.log("WaiterManage: open modal clicked");
    try {
      toast.dismiss();
    } catch (e) {}
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://restaurant-backend-rosy.vercel.app/api/waiters/getWaiters/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setWaiters(Array.isArray(res.data) ? res.data : res.data.waiters || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load waiters");
    } finally {
      setLoading(false);
    }
  };

  const filtered = waiters.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (w.name || "").toLowerCase().includes(q) ||
      (w.phone || "").toLowerCase().includes(q)
    );
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone)
      return toast.error("Please provide name and phone");
    try {
      setCreating(true);
      const payload = {
        name: form.name,
        phone: form.phone,
        salary: form.salary ? Number(form.salary) : 0,
        shift: form.shift || "Morning",
        isActive: !!form.isActive,
        restaurantId,
      };

      if (editingId) {
        // update existing waiter
        await axios.put(
          `https://restaurant-backend-rosy.vercel.app/api/waiters/updateWaiter/${editingId}`,
          {
            name: payload.name,
            phone: payload.phone,
            salary: payload.salary,
            shift: payload.shift,
            isActive: payload.isActive,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Waiter updated");
      } else {
        // create new waiter
        await axios.post(
          `https://restaurant-backend-rosy.vercel.app/api/waiters/signupWaiter/${restaurantId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Waiter added");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(initialForm);
      fetchWaiters();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to add/update waiter",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (w) => {
    setEditingId(w._id || w.id);
    setForm({
      name: w.name || "",
      phone: w.phone || "",
      salary: w.salary != null ? String(w.salary) : "",
      shift: w.shift || "Morning",
      isActive: !!w.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this waiter?")) return;
    try {
      setDeletingId(id);
      await axios.delete(
        `https://restaurant-backend-rosy.vercel.app/api/waiters/deleteWaiter/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Deleted");
      fetchWaiters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sidebar>
      <div className="waiter-page">
        <Toaster position="top-right" />

        <header className="waiter-topbar">
          <div>
            <h2>Waiter Management</h2>
            <p className="muted">
              Manage your staff — add, view and remove waiters
            </p>
          </div>

          <div className="topbar-actions">
            <div className="search-wrap" style={{ minWidth: 200 }}>
              <input
                className="form-control"
                placeholder="Search by name or phone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-warning"
              onClick={handleOpenModal}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Loading
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i> Add Waiter
                </>
              )}
            </button>
          </div>
        </header>

        <section className="waiter-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="table-wrap">
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle waiter-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Salary</th>
                      <th>Shift</th>
                      <th>Active</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">
                          No waiters found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((w) => (
                        <tr key={w._id || w.id}>
                          <td>{w.name}</td>
                          <td>{w.phone}</td>
                          <td>
                            {w.salary != null
                              ? `Rs. ${Number(w.salary).toLocaleString()}/-`
                              : "-"}
                          </td>
                          <td>{w.shift || "-"}</td>
                          <td>{w.isActive ? "Yes" : "No"}</td>
                          <td>
                            {new Date(
                              w.createdAt || w.created || Date.now(),
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(w)}
                                type="button"
                              >
                                Edit
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(w._id || w.id)}
                                disabled={deletingId === (w._id || w.id)}
                                type="button"
                              >
                                {deletingId === (w._id || w.id) ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {showModal && (
          <div
            className="wm-modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingId(null);
              setForm(initialForm);
            }}
          >
            <div className="wm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? "Edit Waiter" : "Add Waiter"}</h3>
              <form onSubmit={handleCreate} className="waiter-form">
                <div className="mb-3">
                  <label className="form-label text-start">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-start">Phone</label>
                  <input
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Salary</label>
                  <input
                    className="form-control"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    type="number"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Shift</label>
                  <select
                    className="form-select"
                    name="shift"
                    value={form.shift}
                    onChange={handleChange}
                  >
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setForm(initialForm);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingId ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default WaiterManage;
