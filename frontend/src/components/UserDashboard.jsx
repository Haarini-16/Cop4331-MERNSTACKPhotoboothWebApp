import React, { useState, useRef } from 'react';
import { api } from '../api/apiClient.js';
import './UserDashboard.css';
import { uploadImageToCloud, deleteImageFromCloud } from '../utils/CloudinaryUtil';

export default function UserDashboard() {
    // Stores up to 3 captured images
    const [images, setImages] = useState([]);
    // Holds the layout template frame
    const [frame, setFrame] = useState(null);
    // Stores final delivery link
    const [cloudinaryUrl, setCloudinaryUrl] = useState('');
    // Saves the deletion key from cloudinary 
    const [deleteToken, setDeleteToken] = useState('');
    // Tracks user input inside change password
    const [newPassword, setNewPassword] = useState('');
    // Tracks on-screen text alerts for success or failure 
    const [passMessage, setPassMessage] = useState('');
    //Track camera
    const [isCameraActive, setIsCameraActive] = useState(false);
    // Tracks uploading state
    const [isUploading, setIsUploading] = useState(false);

    // References for HTML video tag streaming live camera frames
    const videoRef = useRef(null);
    // References for HTML canvas to render and stitch the final strip
    const canvasRef = useRef(null);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPassMessage('');
        if (newPassword.length < 5 || !/\d/.test(newPassword)) {
            return setPassMessage("Requires 5 characters and 1 number.");
        }
        try {
            await api.user.changePassword(newPassword);
            setPassMessage("Password changed successfully.");
            setNewPassword('');
        } catch (err) {
            setPassMessage(err.message);
        }
    };

    const startLiveCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch {
            alert("Camera Blocked or Offline");
        }
    };

    const stopCamera = () =>{
        if (videoRef.current && videoRef.current.srcObject){
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }

    const captureCameraFrame = () => {
        if (images.length >= 3) {
            return alert("No more than 3 pictures on a strip.");
        }
        const clipCanvas = document.createElement('canvas');
        clipCanvas.width = 400;
        clipCanvas.height = 400;
        const c = clipCanvas.getContext('2d');
        c.drawImage(videoRef.current, 0, 0, 400, 400);
        setImages([...images, clipCanvas.toDataURL('image/png')]);
    };

    const processFileImport = (e) => {
        if (images.length >= 3) {
            return alert("No more than 3 pictures on a strip.");
        }
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImages([...images, reader.result]);
        reader.readAsDataURL(file);
    };

    const processFrameImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setFrame(reader.result);
        reader.readAsDataURL(file);
    };

    const drawStripLayout = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const c = canvas.getContext('2d');
        c.clearRect(0, 0, 1200, 400);

        let filesLoaded = 0;
        const drawOverlay = () => {
            filesLoaded++;
            if (filesLoaded === images.length && frame) {
                const overlay = new window.Image();
                overlay.src = frame;
                overlay.onload = () => c.drawImage(overlay, 0, 0, 1200, 400);
            }
        };

        images.forEach((src, index) => {
            const picture = new window.Image();
            picture.src = src;
            picture.onload = () => {
                c.drawImage(picture, index * 400, 0, 400, 400);
                drawOverlay();
            };
        });
    };

    const dispatchToCloudEngine = () => {
        canvasRef.current.toBlob(async (blob) => {
            try {
                const result = await uploadImageToCloud(blob);
                setCloudinaryUrl(result.url);
                setDeleteToken(result.deleteToken);
                alert("Pushed the canvas successfully to cloud storage");
            } catch {
                alert("Cloud pipeline rejected operations.");
            }
        }, 'image/png');
    };

    const dropCloudAsset = async () => {
        try {
            await deleteImageFromCloud(deleteToken);
            setCloudinaryUrl('');
            setDeleteToken('');
            alert("Deleted from cloud storage.");
        } catch {
            alert("Failed deletion.");
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                Creative Workspace
            </h2>

            {/* Password Self Service */}
            <div style={{ background: '#eadcdf', padding: '15px', borderRadius: '6px', marginBottom: '30px' }}>
                <h4>Update Password</h4>

                <form onSubmit={handlePasswordUpdate}>
                    <input 
                        type="password"
                        placeholder="New secure entry key"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ padding: '8px', width: '250px', marginRight: '10px' }}
                    />
                    <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>
                        Commit change
                    </button>
                </form>
                {passMessage && (
                    <p style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>
                        {passMessage}
                    </p>
                )}
            </div>

            {/* Primary Workplace Split Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                    <h3>Capture Stack Inputs</h3>
                    <button onClick={startLiveCamera} style={{ padding: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                        Turn on Camera
                    </button>

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '240px', background: '#000', display: 'block', borderRadius: '4px' }}
                    />
                    <button
                        onClick={captureCameraFrame}
                        style={{ marginTop: '10px', padding: '10px 20px', background: '#670f18', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Capture Snap
                    </button>

                    <h5 style={{ marginTop: '25px', marginBottom: '8px' }}>
                        Import Image
                    </h5>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={processFileImport}
                    />

                    <h3 style={{ marginTop: '35px' }}>
                        Upload layout frame 
                    </h3>
                    <input
                        type="file"
                        accept="image/png"
                        onChange={processFrameImport}
                    />

                    <button 
                        onClick={() => setImages([])}
                        style={{ display: 'block', marginTop: '40px', background: '#27070a', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Reset Canvas
                    </button>
                </div>

                {/* Live Rendering and Cloud Delivery Stuff */}
                <div>
                    <h3>Canvas Compiling</h3>

                    <button
                        onClick={drawStripLayout}
                        style={{ padding: '10px 20px', background: '#ffc107', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px' }}
                    >
                        Compile Layout Strip
                    </button>
                    <div style={{ border: '2px solid #ccc', background: '#aaa', padding: '10px', borderRadius: '4px' }}>
                        <canvas
                            ref={canvasRef}
                            width="1200"
                            height="400"
                            style={{ width: '100%', height: 'auto', background: '#fff', display: 'block' }}
                        />
                    </div>
                    
                    <h3 style={{ marginTop: '35px' }}>
                        Cloud Operations
                    </h3>

                    <button 
                        onClick={dispatchToCloudEngine}
                        disabled={images.length < 3}
                        style={{ padding: '12px 24px', background: '#28a745', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Direct Upload
                    </button>

                    {cloudinaryUrl && (
                        <div style={{ marginTop: '25px', padding: '20px', background: '#e2e3e5', border: '1px solid #ced4da', borderRadius: '4px' }}>
                            <p style={{ wordBreak: 'break-all', marginTop: '0' }}>
                                <strong>Image Link:</strong>{' '}
                                <a href={cloudinaryUrl} target="_blank" rel="noreferrer">
                                    {cloudinaryUrl}
                                </a>
                            </p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                                <a 
                                    href={cloudinaryUrl} 
                                    download="photobooth_strip.png" 
                                    style={{ background: '#17a2b8', color: '#fff', padding: '10px 15px', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                                >
                                    Download Strip 
                                </a>
                
                                <a 
                                    href={`mailto:?subject=Photobooth Asset Strip Generated&body=Access asset canvas link directly: ${cloudinaryUrl}`} 
                                    style={{ background: '#6c757d', color: '#fff', padding: '10px 15px', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
                                >
                                    Send Email   
                                </a>
                                
                                <button 
                                    onClick={dropCloudAsset} 
                                    style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 15px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                                >
                                    Delete From Storage
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
