import React, { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend API for login
      const response = await axios.post(
        "https://restaurant-backend-rosy.vercel.app/api/users/login",
        {
          email,
          password,
        },

        
      );

      

      if (response.data.success === true) {
        // Store token and redirect
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Login successful!");
        setTimeout(() => {
          navigate("/dashboard/owner");
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="login-container">
        <img
          src="/images/main2.png"
          alt="Restaurant POS Login"
          className="login-bg-image"
        />
        <div className="login-overlay"></div>

        <div className="login-form-section">
          <div className="login-form-wrapper">
            <div className="logo-section">
              <div className="logo-icon">
                <i className="fas fa-utensils"></i>
              </div>
              <h3 className="logo-text">Restaurant POS</h3>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to manage your restaurant</p>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <i className="fas fa-envelope label-icon"></i>
                  Email Address
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    className="form-input form-control"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <i className="fas fa-lock label-icon"></i>
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    className="form-input form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-button btn btn-primary w-100"
                disabled={loading}
              >
                <i className="fas fa-arrow-right button-icon"></i>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="divider">or</div>

            {/* Sign Up Link */}
            <p className="signup-link">
              New to Restaurant POS? <a href="#signup">Create an account</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
