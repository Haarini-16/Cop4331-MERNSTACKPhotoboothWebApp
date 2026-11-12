import React, { useState } from 'react';
import { api } from '../api/apiClient';

export default function Login() {

    // State to control
    const [currentView, setCurrentView] = useState('login');

    // Form inputs state
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [signupData, setSignupData] = useState({ firstName: '', lastName: '', login: '', password: '' });
    const [forgotData, setForgotData] = useState({ fpUsername: '', fpEmail: '' });

    // Message alerts state
    const [loginMessage, setLoginMessage] = useState({ text: '', success: false });
    const [signupMessage, setSignupMessage] = useState({ text: '', success: false });

    const API_URL = "../../../backend/middleware/auth.js"; 
    const DASHBOARD_URL = "userDashboard.js";
    const ADMIN_URL = "adminDashboard.js";

    // Handle Login submission
    async function handleLogin(event) {
        event.preventDefault();
        setLoginMessage({ text: '', success: false });

        try {
            const response = await fetch(`${API_URL}?action=login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    login: loginData.username,
                    password: loginData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setLoginMessage({ text: data.error || "Login failed.", success: false });
                return;
            }

            const user = data.user || data;
            sessionStorage.setItem("user", JSON.stringify(user));
            setLoginMessage({ text: "Login successful!", success: true });

            // Redirect based on role
            window.location.href = user.role === "admin" ? "adminDashboard.js" : "userDashboard.js";

        } catch (error) {
            console.error(error);
            setLoginMessage({ text: "Could not connect to the server.", success: false });
        }
    }

    // Handle Signup submission
    async function handleSignup(event) {
        event.preventDefault();
        setSignupMessage({ text: '', success: false });

        try {
            const response = await fetch(`${API_URL}?action=signup`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();

            if (!response.ok) {
                setSignupMessage({ text: data.error || "Could not create account.", success: false });
                return;
            }

            setSignupMessage({ text: "Account created successfully! You can now log in.", success: true });
            setSignupData({ firstName: '', lastName: '', login: '', password: '' });

        } catch (error) {
            console.error(error);
            setSignupMessage({ text: "Could not connect to the server.", success: false });
        }
    }
}
    return (
        <div className="container">

            {/* LOGIN */}
            <div id="loginForm">
                <h1>Login</h1>
                <div id="loginMessage" className="message"></div>

                <form onSubmit={login}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="primary">
                        Log In
                    </button>
                </form>

                <div className="divider">or</div>

                <button type="button" className="success" onClick={showSignup}>
                    Create New User
                </button>

                <button type="button" className="text-button" onClick={showForgotPassword}>
                    Forgot Password
                </button>
            </div>

            {/* FORGOT PASSWORD */}
            <div id="forgotPassword">
                <div className="form-group">
                    <label htmlFor="fpUsername">Username</label>
                    <input
                        type="text"
                        id="fpUsername"
                        required
                        autoComplete="username"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="fpEmail">Email</label>
                    <input
                        type="text"
                        id="fpEmail"
                        required
                        autoComplete="email"
                    />
                </div>

                <button type="button" className="secondary" onClick={showLogin}>
                    Back to Login
                </button>
            </div>

            {/* SIGNUP */}
            <div id="signupForm">
                <h1>Create User</h1>
                <div id="signupMessage" className="message"></div>

                <form onSubmit={signup}>
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            maxLength="50"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            maxLength="50"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newLogin">Username</label>
                        <input
                            type="text"
                            id="newLogin"
                            maxLength="50"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="success">
                        Create Account
                    </button>
                </form>

                <div className="divider">or</div>

                <button type="button" className="secondary" onClick={showLogin}>
                    Back to Login
                </button>
            </div>

        </div>
    );

