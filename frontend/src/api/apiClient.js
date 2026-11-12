//base url for backend 
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://147.182.191.129/api";

//centralized api client
async function request(endpoint, options ={}) 
{
    const defaultHeaders =
    {
        "Content-Type": "application/json",
        ...options.headers,
    };   

    const config =
    {
        ...options,
        headers: defaultHeaders,
        credentials: "include",
    };

    try
    {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        //parsing json response
        const data = await response.json().catch(() => ({}));

        if(!response.ok)
        {
            throw new Error(data.error || data.message || `request failed ${response.status}$`);
        }

        return data;
    }
    catch(err)
    {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}
export const api = 
{
    //auth and user endpoints
    user: 
    {
        login: (credentials) => request("/users?action=login",
        {
            method: "POST",
            body: JSON.stringify(credentials)
        }),

        signup: (userData) => request("/users?action=signup",
        {
            method: "POST",
            body: JSON.stringify(userData)
        }),

        changePassword: (newPassword) => request("/users/password",
        {
           method: "PUT",
           body: JSON.stringify({newpassword}) 
        }),
    },

    admin:
    {
        getAllUsers: () => request("/admin/users",
        {
            method:"GET"
        }),
        
        updateUserStatus: (userID, isActive) => request(`/admin/users/${userID}/status`,
        {
            method:"PUT",
            body:JSON.stringify({isActive})
        }),

        overridePassword: (userID, newPassword) => request(`/admin/users/${userID}/password`,
        {
            method:"PUT",
            body:JSON.stringify({newPassword})
        }),
    }
};
