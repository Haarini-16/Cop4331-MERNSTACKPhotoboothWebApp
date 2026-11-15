//base url for backend 
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://147.182.191.129:5000/api";

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
    };

   // DEBUG: Log what data is actually being sent
    if (config.body) {
        console.log(`API Request [${endpoint}] Payload:`, config.body);
    }

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
        login: (credentials) => request("/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials)
        }),

        signup: (userData) => request("/users?action=signup",
        {
            method: "POST",
            body: JSON.stringify(userData)
        }),

    	resetPassword: (resetData) => request("/auth/reset-password", {
 	    method: "POST",
	    body: JSON.stringify(resetData)
	}),
	    
	changePassword: (newPassword) => request("/users/password",
        {
           method: "PUT",
           body: JSON.stringify({newPassword}) 
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
