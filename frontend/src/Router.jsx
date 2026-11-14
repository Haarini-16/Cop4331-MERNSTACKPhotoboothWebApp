import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from './components/login.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';


//restricts view access based on role
//whether the role of the person logged it is a user or admin
export default function PrivateRoute({ childern, requiredRole})
{
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if(!token)
    {
        return <Navigate to="/login" replace />;
    }

    if(requiredRole && role != requiredRole)
    {
        return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replave />;
    }
    return childern;
}
