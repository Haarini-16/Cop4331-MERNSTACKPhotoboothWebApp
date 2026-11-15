import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/apiClient.js';
import './login.css';

export default function Login() {
    const API_URL = 'http://147.182.191.129:5000/api';
    const navigate = useNavigate();

    const [currentView, setCurrentView] = useState('login');

    // Form inputs state
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    
    // sign up data
    const [signupData, setSignupData] = useState({ username: '', email: '', password: '' });
    
    // forget data
    const [forgotData, setForgotData] = useState({ fpUsername: '', fpEmail: '' });

    //reset passwors 
    const [resetData, setResetData] = useState({code: '', password: ''});

    // Message alerts state
    const [loginMessage, setLoginMessage] = useState({ text: '', success: false });
    const [signupMessage, setSignupMessage] = useState({ text: '', success: false });
    const [forgotMessage, setForgotMessage] = useState({ text: '', success: false });
    const [resetMessage, setResetMessage] = useState({text: '', success: false});

    const showLogin = () => { setCurrentView('login'); setLoginMessage({ text: '', success: false }); };
    const showSignup = () => { setCurrentView('signup'); setSignupMessage({ text: '', success: false }); };
    const showForgotPassword = () => { setCurrentView('forgot'); setForgotMessage({ text: '', success: false }); };

    // Handle Login submission
    async function handleLogin(event) {
        event.preventDefault();
        setLoginMessage({ text: '', success: false });

        try {
            const data = await api.user.login({
                username: loginData.username,
                password: loginData.password
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user?.role || data.role);
	    localStorage.setItem("userId", data.user?._id || data.user?.id);

            setLoginMessage({ text: "Login successful!", success: true });

            const userRole = data.user?.role || data.role;
            navigate(userRole === "admin" ? "/admin" : "/dashboard");

        } catch (error) {
            console.error(error);
	    if (error.message.includes("Please verify your email")){
		    setLoginMessage({
			    text:"Your account is not verfied. Please check your email first.",
		    success: false
		    });
	    }
	    else{
            	setLoginMessage({
                	text: error.message || "Login failed. Please check your credentials.",
                	success: false
	            });
	    }
        }
    }

    // Handle Signup submission
    async function handleSignup(event) {
        event.preventDefault();
        setSignupMessage({ text: '', success: false });
	
	if (signupData.password.length < 5){
	setSignupMessage({
		text:"Password must be at least 5 characters long.",
		success:false
		});
		return;
	}

        try {
            await api.user.signup(signupData);

            setSignupMessage({ text: "Account created successfully! You can now log in.", success: true });
            setSignupData({ username: '', email: '', password: '' });

        } catch (error) {
            console.error(error);
            setSignupMessage({
                text: error.message || "Could not create account.",
                success: false
            });
        }
    }

    // Forgot password
    async function handleForgotPassword(event) {
        event.preventDefault();
        setForgotMessage({ text: '', success: false });

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotData.fpEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                setForgotMessage({ text: data.error || "Password reset request failed.", success: false });
                return;
            }

            setForgotMessage({ text: "Password reset code sent to your email.", success: true });

	    setTimeout(() => {
		    setCurrentView('reset');
	    }, 1500);

        } catch (error) {
            console.error(error);
            setForgotMessage({ text: "Could not connect to the server.", success: false });
        }
    }
	async function handleResetPassword(event) {
		event.preventDefault();
		setResetMessage({text: '', success: false});

		if (resetData.password.length < 5) {
			setResetMessage({text: "Password must be at least 5 characters.", success: false});
			return;
		}
		
		try{
			const response = await fetch(`${API_URL}/auth/reset-password`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					code: resetData.code,
					password: resetData.password
				})
			});
			const data = await response.json();

			if(!response.ok){
				setResetMessage({text: data.error || "Failed to reset password.", success: false});
				return;
			}
			setResetMessage({text: "Password has been reset, you can log in now!", success: true});

			setTimeout(() => {
				setCurrentView('login');
				setResetData({code: '', password: ''});
			},2000);
		}catch(error){
			console.error(error);
			setResetMessage({text: "Could not connect to the server.", success: false});
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
                    {forgotMessage.text && (
                        <div className={`message ${forgotMessage.success ? 'success' : 'error'}`}>
                            {forgotMessage.text}
                        </div>
                    )}
                    <form onSubmit={handleForgotPassword}>
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
                                type="email"
                                id="fpEmail"
                                required
                                autoComplete="email"
                                value={forgotData.fpEmail}
                                onChange={(e) => setForgotData({ ...forgotData, fpEmail: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="primary">
                            Reset Password
                        </button>
                    </form>

                    <button type="button" className="secondary" onClick={showLogin}>
                        Back to Login
                    </button>
                </div>
            )}
	    {/* RESET PASSWORD VIEW (Step 2) */}
            {currentView === 'reset' && (
                <div id="resetPasswordForm">
                    <h1>Set New Password</h1>
                    <p style={{ textAlign: 'center', color: '#ffcccc', fontSize: '14px', marginBottom: '20px' }}>
                        Enter the code sent to your email and your new password.
                    </p>

                    {resetMessage.text && (
                        <div className={`message ${resetMessage.success ? 'success' : 'error'}`}>
                            {resetMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label htmlFor="resetCode">Reset Code</label>
                            <input
                                type="text"
                                id="resetCode"
                                required
                                placeholder="Enter code from email"
                                value={resetData.code}
                                onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                required
                                minLength="5"
                                placeholder="At least 5 characters"
                                value={resetData.password}
                                onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="primary">
                            Update Password
                        </button>
                    </form>

                    <button type="button" className="secondary" onClick={() => setCurrentView('login')} style={{ marginTop: '10px' }}>
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
                            <input
                                type="text"
                                placeholder="Username"
                                value={signupData.username}
                                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={signupData.email}
                                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={signupData.password}
                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                minLength={5}
		    		required
                            />
                        </div>
                        <button type="submit" className="success">Sign Up</button>
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
