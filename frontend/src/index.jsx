import React from 'react';
import ReactDOM from 'react-dom/client';
import App from'./App';
import './components/login.css';
import './components/AdminDashboard.css';
import './components/UserDashboard.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
