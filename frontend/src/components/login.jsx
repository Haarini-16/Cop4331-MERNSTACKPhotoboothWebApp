import React, { useState } from 'react';
import {api} from '../api/apiClient.js';
import './login.css';

export default function Login() {
    // State to control which view is visible ('login', 'signup', or 'forgot')
    const [currentView, setCurrentView] = useState('login');

    // Form inputs state
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [signupData, setSignupData] = useState({ firstName: '', lastName: '', login: '', password: '' });
    const [forgotData, setForgotData] = useState({ fpUsername: '', fpEmail: '' });

    // Message alerts state
    const [loginMessage, setLoginMessage] = useState({ text: '', success: false });
    const [signupMessage, setSignupMessage] = useState({ text: '', success: false });

    const API_URL = "../../../backend/middleware/auth.js";

    // Navigation helpers
    const showLogin = () => { setCurrentView('login'); setLoginMessage({ text: '', success: false }); };
    const showSignup = () => { setCurrentView('signup'); setSignupMessage({ text: '', success: false }); };
    const showForgotPassword = () => { setCurrentView('forgot'); };

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

    return (
        <div className="container">

            {/* LOGIN VIEW */}
            {currentView === 'login' && (
                <div id="loginForm">
                    <h1>Login</h1>
                    {loginMessage.text && (
                        <div id="loginMessage" className={`message ${loginMessage.success ? 'success' : 'error'}`}>
                            {loginMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                required
                                autoComplete="username"
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                required
                                autoComplete="current-password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
            )}

            {/* FORGOT PASSWORD VIEW */}
            {currentView === 'forgot' && (
                <div id="forgotPassword">
                    <h1>Forgot Password</h1>
                    <div className="form-group">
                        <label htmlFor="fpUsername">Username</label>
                        <input
                            type="text"
                            id="fpUsername"
                            required
                            autoComplete="username"
                            value={forgotData.fpUsername}
                            onChange={(e) => setForgotData({ ...forgotData, fpUsername: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fpEmail">Email</label>
                        <input
                            type="text"
                            id="fpEmail"
                            required
                            autoComplete="email"
                            value={forgotData.fpEmail}
                            onChange={(e) => setForgotData({ ...forgotData, fpEmail: e.target.value })}
                        />
                    </div>

                    <button type="button" className="secondary" onClick={showLogin}>
                        Back to Login
                    </button>
                </div>
            )}

            {/* SIGNUP VIEW */}
            {currentView === 'signup' && (
                <div id="signupForm">
                    <h1>Create User</h1>
                    {signupMessage.text && (
                        <div id="signupMessage" className={`message ${signupMessage.success ? 'success' : 'error'}`}>
                            {signupMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                maxLength="50"
                                required
                                value={signupData.firstName}
                                onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                maxLength="50"
                                required
                                value={signupData.lastName}
                                onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
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
                                value={signupData.login}
                                onChange={(e) => setSignupData({ ...signupData, login: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                required
                                autoComplete="new-password"
                                value={signupData.password}
                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
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
            )}

        </div>
    );
}
