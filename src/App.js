import logo from "./logo.svg";
import "./App.css";
import Login from "./components/Login";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardOwner from "./pages/DashboardOwner";
import WaiterManage from "./pages/WaiterManage";
import ProductManage from "./pages/ProductManage";
import OrderPlace from "./pages/OrderPlace";
import ManageOrders from "./pages/ManageOrders";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/owner" element={<DashboardOwner />} />
      <Route path="/waiters" element={<WaiterManage />} />
      <Route path="/products" element={<ProductManage />} />
      <Route path="/new-order" element={<OrderPlace />} />
      <Route path="/orders" element={<ManageOrders />} />
      {/* <Route path="/dashboard/staff" element={<DashboardStaff />} />
     <Route path="/new-order" element={<NewOrder />} /> */}
    </Routes>
  );
}

export default App;
