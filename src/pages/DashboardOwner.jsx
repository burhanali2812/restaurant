import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import "./DashboardOwner.css";
import axios from "axios";

function DashboardOwner() {
  const [userName, setUserName] = useState("Owner");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;




  // Update current date/time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch metrics
  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://restaurant-backend-rosy.vercel.app/api/dashboard/metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
          },
        },
      );

      if (response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // Set dummy data if API fails
      setMetrics({
        totalSales: 45200,
        totalOrders: 128,
        pendingOrders: 12,
        activeOrders: 5,
        inProgressOrders: 8,
        completedOrders: 103,
      });
    } finally {
      setLoading(false);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleDateChange = (e, type) => {
    const date = new Date(e.target.value);
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const quickAccessButtons = [
    {
      label: "Place Order",
      icon: "fa-plus-circle",
      color: "#f59e0b",
      href: "/new-order",
    },
    {
      label: "Manage Orders",
      icon: "fa-list-check",
      color: "#3b82f6",
      href: "/orders",
    },
    {
      label: "Manage Products",
      icon: "fa-utensils",
      color: "#10b981",
      href: "/products",
    },
    {
      label: "Manage Waiters",
      icon: "fa-user-tie",
      color: "#8b5cf6",
      href: "/waiters",
    },
    {
      label: "Manage Stock",
      icon: "fa-boxes-stacked",
      color: "#ec4899",
      href: "/stock",
    },
    {
      label: "Generate Report",
      icon: "fa-file-pdf",
      color: "#ef4444",
      href: "/daily-report",
    },
  ];

  return (
    <Sidebar>
      <div className="dashboard-container">
        {/* Top Bar */}
        <div className="dashboard-top-bar">
          <div className="top-bar-left">
            <h2 className="dashboard-title">
              <i className="fas fa-chart-line"></i> Dashboard
            </h2>
          </div>

          <div className="top-bar-right">
            <div className="user-info">
              <i className="fas fa-user-circle user-icon"></i>
              <div className="user-details">
                <p className="user-name">{user?.username}</p>
                <p className="user-status">Restaurant Owner</p>
              </div>
            </div>

            <div className="divider"></div>

            <div className="date-time-section">
              <div className="date-time-display">
                <i className="fas fa-calendar-alt"></i>
                <span className="date-text">{formatDate(currentDateTime)}</span>
              </div>
              <div className="time-display">
                <i className="fas fa-clock"></i>
                <span className="time-text">{formatTime(currentDateTime)}</span>
              </div>
            </div>

            <button
              className="calendar-btn"
              onClick={() => setShowCalendar(!showCalendar)}
              title="Select date range"
            >
              <i className="fas fa-calendar-days"></i>
            </button>

            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="calendar-dropdown" ref={calendarRef}>
                <h4>Filter by Date Range</h4>
                <div className="date-range-inputs">
                  <div className="date-input-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate.toISOString().split("T")[0]}
                      onChange={(e) => handleDateChange(e, "start")}
                    />
                  </div>
                  <div className="date-input-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate.toISOString().split("T")[0]}
                      onChange={(e) => handleDateChange(e, "end")}
                    />
                  </div>
                </div>
                <button
                  className="apply-btn"
                  onClick={() => {
                    setShowCalendar(false);
                    fetchMetrics();
                  }}
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="metrics-section">
          <h3 className="section-title">
            <i className="fas fa-chart-bar"></i> Performance Metrics
          </h3>

          {loading ? (
            <div className="loading">Loading metrics...</div>
          ) : (
            <div className="metrics-grid">
              <div className="metric-card total-sales">
                <div className="metric-header">
                  <h4>Total Sales</h4>
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <p className="metric-value">
                  ₹{metrics.totalSales?.toLocaleString()}
                </p>
                <p className="metric-subtitle">Revenue generated</p>
              </div>

              <div className="metric-card total-orders">
                <div className="metric-header">
                  <h4>Total Orders</h4>
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <p className="metric-value">{metrics.totalOrders}</p>
                <p className="metric-subtitle">Orders placed</p>
              </div>

              <div className="metric-card pending-orders">
                <div className="metric-header">
                  <h4>Pending Orders</h4>
                  <i className="fas fa-hourglass-start"></i>
                </div>
                <p className="metric-value">{metrics.pendingOrders}</p>
                <p className="metric-subtitle">Awaiting processing</p>
              </div>

              <div className="metric-card active-orders">
                <div className="metric-header">
                  <h4>Active Orders</h4>
                  <i className="fas fa-lightning-bolt"></i>
                </div>
                <p className="metric-value">{metrics.activeOrders}</p>
                <p className="metric-subtitle">Currently active</p>
              </div>

              <div className="metric-card in-progress-orders">
                <div className="metric-header">
                  <h4>In Progress</h4>
                  <i className="fas fa-spinner"></i>
                </div>
                <p className="metric-value">{metrics.inProgressOrders}</p>
                <p className="metric-subtitle">Being prepared</p>
              </div>

              <div className="metric-card completed-orders">
                <div className="metric-header">
                  <h4>Completed Orders</h4>
                  <i className="fas fa-check-circle"></i>
                </div>
                <p className="metric-value">{metrics.completedOrders}</p>
                <p className="metric-subtitle">Successfully delivered</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Access Buttons */}
        <div className="quick-access-section">
          <h3 className="section-title">
            <i className="fas fa-zap"></i> Quick Access
          </h3>
          <div className="quick-access-grid">
            {quickAccessButtons.map((btn, index) => (
              <a
                key={index}
                href={btn.href}
                className="quick-access-btn"
                style={{ "--accent-color": btn.color }}
              >
                <div className="btn-icon">
                  <i className={`fas ${btn.icon}`}></i>
                </div>
                <span className="btn-label">{btn.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div style={{marginTop : "100px"}}>
            
        </div>
      </div>
    </Sidebar>
  );
}

export default DashboardOwner;
