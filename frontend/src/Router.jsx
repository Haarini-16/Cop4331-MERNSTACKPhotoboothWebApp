import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx'; 

// Restricts view access based on role
function PrivateRoute({ children, requiredRole }) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && role !== requiredRole) {
        return <Navigate to={role === 'Admin' ? '/Admin' : '/dashboard'} replace />;
    }
    
    return children;
}

function RootRedirect() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <Navigate to={role === 'Admin' ? '/Admin' : '/dashboard'} replace />;
}

// Main router 
export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* User dashboard */}
                <Route 
                    path="/dashboard"
                    element={
                        <PrivateRoute requiredRole="User">
                            <UserDashboard />
                        </PrivateRoute>
                    }
                />

                {/* Admin dashboard */}
                <Route 
                    path="/Admin"
                    element={
                        <PrivateRoute requiredRole="Admin">
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />
	    	{/* Catch-all fallback for undefined URLs */}	
                <Route path="*" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    );
}
