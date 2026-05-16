import React, { useState } from "react";
import "./Sidebar.css";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
function Sidebar({ children }) {
//  const [lengthOfPendingLeaves, setLengthOfPendingLeaves] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
    const [restaurantInfo, setRestaurantInfo] = useState(null);
  const userRole = token ? JSON.parse(atob(token.split(".")[1])).role : null;
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  
    // Fetch restaurant info on mount
    //   useEffect(() => {
    //   const fetchRestaurantInfo = async () => {
    //     try {
    //       const response = await axios.get(
    //         `https://restaurant-backend-rosy.vercel.app/api/restaurant/getRestaurant/${user.restaurantId}`,
    //         {
    //           headers: {
    //             Authorization: `Bearer ${token}`,
    //           },
    //         }
    //       );
    //       setRestaurantInfo(response.data);
    //     } catch (error) {
    //       console.error("Error fetching restaurant info:", error);
    //     }
    //   };
  
    //   fetchRestaurantInfo();
    // }, [token, user?.restaurantId]);
  

  const [isOpen, setIsOpen] = useState(false);
//   useEffect(() => {
//     const fetchPendingLeaves = async () => {
//       try {
//         const res = await axios.get(
//           `https://ec-backend-phi.vercel.app/api/leave/lengthOfPendingLeaves`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           },
//         );
//         const data = res?.data || {};
//         if (data.success) {
//           setLengthOfPendingLeaves(data.pendingLeaves);
//         }
//       } catch (error) {
//         console.error("Error fetching pending leaves:", error);
//       }
//     };

//     if (userRole === "admin" && token) {
//       fetchPendingLeaves();
//     }
//   }, [userRole, token]);

  const handlelogOut = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

 const menuItems = [
  {
    title: "Dashboard",
    icon: "fa-solid fa-gauge",
    href: "/dashboard/owner",
  },

  {
    title: "New Order",
    icon: "fa-solid fa-cart-plus",
    href: "/new-order",
  },

  {
    title: "Manage Orders",
    icon: "fa-solid fa-clipboard-list",
    href: "/orders",
  },

  {
    title: "Products",
    icon: "fa-solid fa-utensils",
    href: "/products",
  },

  {
    title: "Categories",
    icon: "fa-solid fa-layer-group",
    href: "/categories",
  },

  {
    title: "Waiters",
    icon: "fa-solid fa-user-group",
    href: "/waiters",
  },


  {
    title: "Daily Report",
    icon: "fa-solid fa-chart-column",
    href: "/daily-report",
  },

  {
    title: "Stock",
    icon: "fa-solid fa-boxes-stacked",
    href: "/stock",
  },

  {
    title: "Settings",
    icon: "fa-solid fa-gear",
    href: "/settings",
  },

  {
    title: "Logout",
    icon: "fa-solid fa-right-from-bracket",
    href: "/",
  },
];
  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);
  console.log("User from Sidebar:", user);

  return (
    <div className="sb-layout">
      <header className="sb-mobile-topbar">
        <div className="sb-brand-wrap">
          <img src="/images/logo.png" alt="EC Portal" width={90} />
        </div>

        <div className="sb-topbar-center">
          <h3 className="mt-0 fw-semibold sb-mobile-title">
            {user?.restaurantId?.name || "Restaurant POS"}
          </h3>
      
        </div>
      

        <div className="sb-mobile-actions">
          <button
            className="sb-hamburger"
            onClick={toggleMenu}
            aria-label="Toggle sidebar menu"
            aria-expanded={isOpen}
            type="button"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header>

      <aside className="sb-desktop-sidebar">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
         
        >
          <img src="/images/logo.png" alt="EC Portal" width={160} />
        </div>
        <div className="sb-header">
          <h3 className="mb-1 text-dark text-center ">
            {user?.restaurantId?.name || "Restaurant POS"}
          </h3>
        </div>
        <p className="mb-0 text-muted text-center ">
          {user?.restaurantId?.address || "123 Main Street"}
        </p>

        <nav className="sb-nav">
          {menuItems
            .filter((item) => !item.onClick)
            .map((item) => (
              <a
                key={item.title}
                href={item.href || "#"}
                className="sb-link"
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
              >
                <i className={`fas ${item.icon}`}></i>
                <span className="sb-link-text">{item.title}</span>
               
              </a>
            ))}
        </nav>

        <div className="sb-footer">
          <button
            className="sb-logout-btn"
            type="button"
            onClick={handlelogOut}
          >
            <i className="fas fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </aside>

      <aside className={`sb-mobile-panel ${isOpen ? "open" : ""}`}>
        <div className="sb-mobile-panel-head">
          <h6 className="mb-0">Menu</h6>
          <button
            className="sb-close"
            onClick={closeMenu}
            aria-label="Close sidebar menu"
            type="button"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <nav className="sb-nav sb-mobile-nav">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href || "#"}
              className="sb-link"
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
                closeMenu();
              }}
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="sb-link-text">{item.title}</span>
            </a>
          ))}
        </nav>
      </aside>

      {isOpen && <div className="sb-overlay" onClick={closeMenu}></div>}

      <main className="sb-main-content">{children}</main>
    </div>
  );
}

export default Sidebar
