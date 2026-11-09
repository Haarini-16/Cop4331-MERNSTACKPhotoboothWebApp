//cloudinary dashboard information
const CLOUD_NAME = "whxfv8tk";
const UPLOAD_PRESET = "photobooth_preset";

//upload an image blob to cloudinary and return the secure url
export const uploadImageToCloud = async (imageblob) => 
{
    const formData = new FormData();
    formData.append('file', imageblob);
    formData.append('upload_preset', UPLOAD_PRESET);

    try
    {
        const response = await fetch(`https://cloudinary.com{CLOUD_NAME}/image/upload`,
            {
                method: 'POST', 
                body: formData
            }
        );

        if(!response.ok)
        {
            throw new Error(`Cloudinary Upload Failed: ${response.status}`);
        }
        const data = await response.json();
        return data.secure_url; 
    }
    catch(error)
    {
        console.error("Error with cloudinaryutil.js:", error);
        throw error;
    }
};

//delete a image from the frontend using temp token
export const deleteImageFromCloud = async (deleteToken) =>
{
    if(!deleteToken)
    {
        throw new Error('No delete token', deleteToken);
    }

    const formData = new FormData();
    formData.append('token', deleteToken);

    try
    {
        const response = await fetch(`https://cloudinary.com{CLOUD_NAME}/delete_by_token`,
            {
                method: 'POST',
                body: formData
            }
        );
        if(!response.ok)
        {
            throw new Error(`Cloudinary Deletion Failed: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error)
    {
        console.error("Error with cloudinaryutil.js:", error);
        throw error;
    }
};
