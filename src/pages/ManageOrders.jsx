import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./ManageOrders.css";

const ORDERS_API = "https://restaurant-backend-rosy.vercel.app/api/orders";
const WAITERS_API = "https://restaurant-backend-rosy.vercel.app/api/waiters";

function ManageOrders() {
  const getStatusLabel = (status) => (status ? status : "pending");

  const [orders, setOrders] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tableNo: "",
    orderType: "dine-in",
    waiterId: "",
    status: "pending",
    discount: "0",
  });

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const restaurantId =
    storedUser?.restaurantId?._id || storedUser?.restaurantId || null;

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();
    fetchWaiters();
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${ORDERS_API}/getOrders/${restaurantId}`, {
        headers,
      });
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWaiters = async () => {
    if (!restaurantId) return;
    setLoadingWaiters(true);
    try {
      const res = await axios.get(`${WAITERS_API}/getWaiters/${restaurantId}`, {
        headers,
      });
      const waiterList = Array.isArray(res.data)
        ? res.data
        : res.data.waiters || [];
      setWaiters(waiterList.filter((waiter) => waiter.isActive !== false));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load waiters");
    } finally {
      setLoadingWaiters(false);
    }
  };

  const getOrderWaiterName = (order) => {
    if (!order?.waiterId) return "-";
    if (typeof order.waiterId === "object") {
      return order.waiterId?.name || "-";
    }
    const matched = waiters.find((waiter) => waiter._id === order.waiterId);
    return matched?.name || "-";
  };

  const getOrderSearchText = (order) => {
    const waiterName = getOrderWaiterName(order);
    const productNames = (order.items || [])
      .map((item) => {
        if (typeof item.productId === "object") {
          return item.productId?.name || item.name || "";
        }
        return item.name || "";
      })
      .join(" ");

    return `${order.OrderNo || ""} ${waiterName} ${productNames}`.toLowerCase();
  };

  const filteredOrders = orders.filter((order) =>
    (statusFilter === "all" || getStatusLabel(order.status) === statusFilter) &&
    getOrderSearchText(order).includes(searchTerm.trim().toLowerCase()),
  );

  const statusCards = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in-progress" },
    { label: "Ready", value: "ready" },
    { label: "Served", value: "served" },
    { label: "Paid", value: "paid" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Out for Delivery", value: "out-for-delivery" },
    { label: "Delivered", value: "delivered" },
  ];

  const getStatusCount = (status) => {
    if (status === "all") return orders.length;
    return orders.filter((order) => getStatusLabel(order.status) === status).length;
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setForm({
      tableNo: order.tableNo || "",
      orderType: order.orderType || "dine-in",
      waiterId:
        typeof order.waiterId === "object"
          ? order.waiterId?._id || ""
          : order.waiterId || "",
      status: order.status || "pending",
      discount: String(order.discount ?? 0),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setForm({
      tableNo: "",
      orderType: "dine-in",
      waiterId: "",
      status: "pending",
      discount: "0",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();

    if (!editingOrder?._id) return;

    const normalizedOrderType = String(form.orderType || "").toLowerCase();
    if (["dine-in", "delivery"].includes(normalizedOrderType) && !form.waiterId) {
      toast.error("Please choose a waiter");
      return;
    }

    try {
      setSaving(true);
      await axios.put(
        `${ORDERS_API}/updateOrder/${editingOrder._id}`,
        {
          tableNo: form.tableNo,
          orderType: form.orderType,
          waiterId: form.waiterId,
          status: form.status,
          discount: form.discount,
        },
        { headers },
      );
      toast.success("Order updated successfully");
      closeModal();
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      setDeletingId(orderId);
      await axios.delete(`${ORDERS_API}/deleteOrder/${orderId}`, { headers });
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to delete order");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setStatusUpdatingId(orderId);
      await axios.put(
        `${ORDERS_API}/updateOrderStatus/${orderId}`,
        { status },
        { headers },
      );
      toast.success(`Status changed to ${status}`);
      setOpenStatusMenuId(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to change order status",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const statusOptions = [
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in-progress" },
    { label: "Ready", value: "ready" },
    { label: "Served", value: "served" },
    { label: "Paid", value: "paid" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Out for Delivery", value: "out-for-delivery" },
    { label: "Delivered", value: "delivered" },
  ];

  return (
    <Sidebar>
      <div className="mo-page">
        <Toaster position="top-right" />

        <header className="mo-topbar">
          <div>
            <h2>Manage Orders</h2>
            <p className="mo-muted">
              Review every order, edit its details, update status, or remove it.
            </p>
          </div>

          <div className="mo-search-wrap">
            <i className="fas fa-search mo-search-icon"></i>
            <input
              type="text"
              className="form-control mo-search-input"
              placeholder="Search by order no, waiter name, or product name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <section className="mo-status-cards">
          {statusCards.map((card) => (
            <button
              key={card.value}
              type="button"
              className={`mo-status-card ${statusFilter === card.value ? "active" : ""}`}
              onClick={() => setStatusFilter(card.value)}
            >
              <span className="mo-status-card-label">{card.label}</span>
              <strong className="mo-status-card-count">{getStatusCount(card.value)}</strong>
            </button>
          ))}
        </section>

        <section className="mo-table-card">
          {loadingOrders ? (
            <div className="mo-loading">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="mo-empty">
              {searchTerm.trim()
                ? "No orders match your search."
                : "No orders found for this restaurant."}
            </div>
          ) : (
            <div className="mo-table-wrap">
              <table className="table mo-table align-middle">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Placed At</th>
                    <th>Order Info</th>
                    <th>Waiter</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const waiterName = getOrderWaiterName(order);
                    return (
                      <tr key={order._id}>
                        <td>
                          <div className="mo-order-no">{order.OrderNo}</div>
                          <small className="text-muted">#{order._id?.slice(-6)}</small>
                        </td>
                        <td>
                          <div className="mo-meta">
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : "-"}
                            </span>
                            <small>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="mo-meta">
                            <span><strong>Type:</strong> {order.orderType}</span>
                            <small><strong>Table:</strong> {order.tableNo || "-"}</small>
                          </div>
                        </td>
                        <td>{waiterName}</td>
                        <td>
                          <div className="mo-items">
                            {(order.items || []).map((item, index) => {
                              const itemName =
                                typeof item.productId === "object"
                                  ? item.productId?.name || item.name
                                  : item.name;
                              return (
                                <div key={`${order._id}-${index}`} className="mo-item-line">
                                  <div>
                                    <div className="mo-item-name">{itemName}</div>
                                    <div className="mo-item-sub">
                                      Qty: {item.quantity} | Rs. {Number(item.price || 0).toLocaleString()} each
                                    </div>
                                  </div>
                                  <strong>Rs. {Number(item.total || 0).toLocaleString()}</strong>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td>Rs. {Number(order.subtotal || 0).toLocaleString()}</td>
                        <td>Rs. {Number(order.discount || 0).toLocaleString()}</td>
                        <td>
                          <strong>Rs. {Number(order.total || 0).toLocaleString()}</strong>
                        </td>
                        <td>
                          <span className={`mo-badge ${getStatusLabel(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td>
                          <div className="mo-action-group">
                            <div className="mo-status-dropdown">
                              <button
                                type="button"
                                className="mo-action-btn status"
                                onClick={() =>
                                  setOpenStatusMenuId((prev) =>
                                    prev === order._id ? null : order._id,
                                  )
                                }
                                disabled={statusUpdatingId === order._id}
                                title="Change status"
                              >
                                {statusUpdatingId === order._id ? (
                                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                ) : (
                                  <i className="fas fa-angle-down me-2"></i>
                                )}
                                Change Status
                              </button>

                              {openStatusMenuId === order._id && (
                                <div className="mo-status-menu">
                                  {statusOptions.map((status) => (
                                    <button
                                      key={status.value}
                                      type="button"
                                      className={`mo-status-option ${status.value === order.status ? "active" : ""}`}
                                      onClick={() => handleStatusChange(order._id, status.value)}
                                      disabled={statusUpdatingId === order._id}
                                    >
                                      {status.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="mo-action-btn"
                              onClick={() => openEditModal(order)}
                              title="Edit order"
                            >
                              <i className="fas fa-pen-to-square me-2"></i>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="mo-action-btn delete"
                              onClick={() => handleDelete(order._id)}
                              disabled={deletingId === order._id}
                              title="Delete order"
                            >
                              {deletingId === order._id ? (
                                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                              ) : (
                                <i className="fas fa-trash me-2"></i>
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showModal && (
          <div className="mo-modal-overlay" onClick={closeModal} role="presentation">
            <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mo-modal-head">
                <div>
                  <h4>Edit Order</h4>
                  <p className="mo-muted mb-0">
                    Update order type, waiter, discount, or status.
                  </p>
                </div>
                <button type="button" className="mo-modal-close" onClick={closeModal}>
                  <i className="fas fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleUpdateOrder}>
                <div className="mo-modal-body">
                  <div className="mo-form-grid">
                    <div className="mo-form-group">
                      <label>Order No</label>
                      <input type="text" value={editingOrder?.OrderNo || ""} readOnly />
                    </div>

                    <div className="mo-form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={handleFormChange}>
                        <option value="in-progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="pending">Pending</option>
                        <option value="served">Served</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="mo-form-group">
                      <label>Order Type</label>
                      <select name="orderType" value={form.orderType} onChange={handleFormChange}>
                        <option value="dine-in">Dine In</option>
                        <option value="takeaway">Take Away</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>

                    <div className="mo-form-group">
                      <label>Table No</label>
                      <input
                        type="text"
                        name="tableNo"
                        value={form.tableNo}
                        onChange={handleFormChange}
                        placeholder="Table no"
                      />
                    </div>

                    <div className="mo-form-group full">
                      <label>Waiter</label>
                      <select
                        name="waiterId"
                        value={form.waiterId}
                        onChange={handleFormChange}
                        disabled={loadingWaiters || form.orderType === "takeaway"}
                      >
                        <option value="">Select waiter</option>
                        {waiters.map((waiter) => (
                          <option key={waiter._id} value={waiter._id}>
                            {waiter.name} - {waiter.phone}
                          </option>
                        ))}
                      </select>
                      {form.orderType === "takeaway" && (
                        <small className="text-muted">Waiter is not required for takeaway.</small>
                      )}
                    </div>

                    <div className="mo-form-group">
                      <label>Discount</label>
                      <input
                        type="number"
                        min="0"
                        name="discount"
                        value={form.discount}
                        onChange={handleFormChange}
                        placeholder="Discount amount"
                      />
                    </div>

                    <div className="mo-form-group full">
                      <div className="mo-items-box">
                        <div className="mo-items-title">Order Items</div>
                        <div className="mo-items-list">
                          {(editingOrder?.items || []).map((item, index) => {
                            const itemName =
                              typeof item.productId === "object"
                                ? item.productId?.name || item.name
                                : item.name;
                            return (
                              <div className="mo-items-row" key={`${editingOrder?._id}-${index}`}>
                                <div>
                                  <div className="mo-item-name">{itemName}</div>
                                  <div className="mo-item-sub">Quantity: {item.quantity}</div>
                                </div>
                                <strong>Rs. {Number(item.total || 0).toLocaleString()}</strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mo-modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
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

export default ManageOrders;
