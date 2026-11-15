import React, { useState, useRef, useEffect, useCallback } from 'react';
import './UserDashboard.css';
import {api} from '../api/apiClient.js';
import { useNavigate } from 'react-router-dom';
import { uploadImageToCloud, deleteImageFromCloud } from '../utils/CloudinaryUtil';

export default function UserDashboard() {
    const API_BASE_URL = 'http://147.182.191.129:5000/api';

    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");

    //photostrip dimensions
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 1800;
    const SLOT_HEIGHT = 500;

    //variables
    const [photoLayers, setPhotoLayers] = useState([]);
    const [textLayers, setTextLayers] = useState([]);
    const [newText, setNewText] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [frameImg, setFrameImg] = useState(null);
    const [draggingItem, setDraggingItem] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    //projects
    const [projects, setProjects] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);

    //video and canvas
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    //get existing photobooth projects
    useEffect(() => {
        if (!currentUserId) return;
        fetch(`${API_BASE_URL}/users/${currentUserId}/photobooths`,{
          headers: {
            'Authorization': `Bearer ${token}`
          }  
        })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setProjects(data); })
            .catch(err => console.error("Failed to load user photobooths", err));
    }, [currentUserId]);

    //clean up camera
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);


    //load image element
    const loadImageElement = (src) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    };

    // Auto-stack photos down
    const addPhotoLayer = async (dataUrl) => {
        if (photoLayers.length >= 3) return;
        try {
            const img = await loadImageElement(dataUrl);
            const slotIndex = photoLayers.length;
            const yOffset = 150 + (slotIndex * (SLOT_HEIGHT + 40));

            setPhotoLayers(prev => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    src: dataUrl,
                    img,
                    x: 50,
                    y: yOffset,
                    width: 500,
                    height: SLOT_HEIGHT
                }
            ]);
        } catch (err) {
            console.error("Error loading image:", err);
        }
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // template
        if (frameImg) {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Default white background if no template
        }

        // photots
        photoLayers.forEach(layer => {
            ctx.drawImage(layer.img, layer.x, layer.y, layer.width, layer.height);
        });

        // text overlays
        textLayers.forEach(t => {
            ctx.font = `bold ${t.fontSize}px sans-serif`;
            ctx.fillStyle = t.color;
            ctx.textBaseline = 'top';
            ctx.fillText(t.text, t.x, t.y);
        });
    }, [photoLayers, frameImg, textLayers]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    //initalize camera
    const startLiveCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 500, height: 500 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        } catch {
            alert("Camera Blocked or Offline");
        }
    };

    //stop camera
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    //capture a frame
    const captureCameraFrame = () => {
        if (photoLayers.length >= 3) return alert("No more than 3 pictures on a strip.");
        if (!videoRef.current) return;

        const clipCanvas = document.createElement('canvas');
        clipCanvas.width = 500;
        clipCanvas.height = SLOT_HEIGHT;
        clipCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, 500, SLOT_HEIGHT);
        addPhotoLayer(clipCanvas.toDataURL('image/png'));
    };

    //uploading the three images
    const processFileImport = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (photoLayers.length + files.length > 3) {
            e.target.value = null;
            return alert("You can only have a maximum of 3 pictures on a strip.");
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => addPhotoLayer(reader.result);
            reader.readAsDataURL(file);
        });
        e.target.value = null;
    };

    //ploading a custom layout for template
    const processFrameImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const img = await loadImageElement(reader.result);
            setFrameImg(img);
        };
        reader.readAsDataURL(file);
    };

    /// Add a text layer onto the canvas workspace
    const handleAddText = () => {
        if (!newText.trim()) return;
        setTextLayers(prev => [
            ...prev,
            { id: Date.now(), text: newText, x: 50, y: 50, color: textColor, fontSize: 40 }
        ]);
        setNewText('');
    };

    //Calculate coordinates to internal dimensions
    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };


    //clicking and dragging items on the canvas
    const handleCanvasMouseDown = (e) => {
        const { x, y } = getCanvasCoords(e);
        const ctx = canvasRef.current.getContext('2d');

        for (let i = textLayers.length - 1; i >= 0; i--) {
            const t = textLayers[i];
            ctx.font = `bold ${t.fontSize}px sans-serif`;
            if (x >= t.x && x <= t.x + ctx.measureText(t.text).width && y >= t.y && y <= t.y + t.fontSize) {
                setDraggingItem({ type: 'text', index: i, offsetX: x - t.x, offsetY: y - t.y });
                return;
            }
        }

        for (let i = photoLayers.length - 1; i >= 0; i--) {
            const p = photoLayers[i];
            if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) {
                setDraggingItem({ type: 'photo', index: i, offsetX: x - p.x, offsetY: y - p.y });
                return;
            }
        }
    };

    //Update coordinates of the actively dragged item
    const handleCanvasMouseMove = (e) => {
        if (!draggingItem) return;
        const { x, y } = getCanvasCoords(e);

        if (draggingItem.type === 'photo') {
            setPhotoLayers(prev => prev.map((item, idx) =>
                idx === draggingItem.index ? { ...item, x: x - draggingItem.offsetX, y: y - draggingItem.offsetY } : item
            ));
        } else if (draggingItem.type === 'text') {
            setTextLayers(prev => prev.map((item, idx) =>
                idx === draggingItem.index ? { ...item, x: x - draggingItem.offsetX, y: y - draggingItem.offsetY } : item
            ));
        }
    };

    //Clear dragging state on mouse release
    const handleCanvasMouseUp = () => setDraggingItem(null);

    //Finalize strip: compile canvas to blob, upload to cloud, and save to backend database
    const handleFinalizeStrip = () => {
        if (photoLayers.length < 3) return alert("Please include 3 pictures before finalizing.");

        setIsFinalizing(true);
        canvasRef.current.toBlob(async (blob) => {
            try {
                const cloudResult = await uploadImageToCloud(blob);
                const res = await fetch(`${API_BASE_URL}/users/${currentUserId}/photobooths`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        imageUrl: cloudResult,
                        layoutDimensions: `${CANVAS_WIDTH}x${CANVAS_HEIGHT}`
                    })
                });

                if (!res.ok)
                    {
                        const errorData = await res.json();
                        console.error("Backend validation error:", errorData);
                        throw new Error(errorData.message || 'Failed to save to database');
                    }
                const savedPhotobooth = await res.json();
                savedPhotobooth.deleteToken = cloudResult.deleteToken;

                setProjects(prev => [savedPhotobooth, ...prev]);
                alert("Strip finalized and saved successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to finalize strip.");
            } finally {
                setIsFinalizing(false);
            }
        }, 'image/png');
    };

    //delete a project
    const handleDeleteProject = async (project) => {
        try {
            if (project.deleteToken) await deleteImageFromCloud(project.deleteToken);
            await fetch(`${API_BASE_URL}/photobooths/${project._id || project.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setProjects(prev => prev.filter(p => (p._id || p.id) !== (project._id || project.id)));
            setOpenMenuId(null);
        } catch {
            alert("Failed to delete project.");
        }
    };

    //email a project
    const handleEmailProject = async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/photobooths/${projectId}/email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }});
            if (!res.ok) throw new Error();
            alert("Strip successfully sent to your email!");
            setOpenMenuId(null);
        } catch {
            alert("Failed to send email.");
        }
    };

    //downlaod a project
    const handleDownloadProject = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'photobooth_strip.png';
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        setOpenMenuId(null);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");

        navigate("/login");
    }

    return (
        <div className="dashboard-container">
            <div className = "dashboard-header-container">
                <h2 className="dashboard-header">Photobooth Workspace</h2>

                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
            <div className="workspace-grid">
                <div>
                    <h3 className="section-title">Camera Inputs</h3>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <button onClick={startLiveCamera} className="btn btn-primary" style={{ marginTop: 0 }}>Turn on Camera</button>
                        {isCameraActive && <button onClick={stopCamera} className="btn btn-danger" style={{ marginTop: 0 }}>Turn off Camera</button>}
                    </div>

                    <video ref={videoRef} autoPlay playsInline className="video-preview" />
                    <button onClick={captureCameraFrame} className="btn btn-primary">Capture Snap ({photoLayers.length}/3)</button>

                    <h3 className="sub-title">Import Images ({photoLayers.length}/3 selected)</h3>
                    <input type="file" accept="image/*" multiple onChange={processFileImport} className="file-input" />

                    <h3 className="sub-title">Upload Layout Template (2x6 Template)</h3>
                    <input type="file" accept="image/png" onChange={processFrameImport} className="file-input" />

                    <button onClick={() => { setPhotoLayers([]); setTextLayers([]); setFrameImg(null); }} className="btn btn-dark">Reset Canvas</button>
                </div>

                <div>
                    <h3 className="section-title"> Strip Editor (2x6 Inches)</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Enter text..."
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            className="file-input"
                            style={{ marginBottom: 0 }}
                        />
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '45px', height: '38px', cursor: 'pointer' }} />
                        <button onClick={handleAddText} className="btn btn-secondary" style={{ marginTop: 0 }}>Add Text</button>
                    </div>

                    <div className="canvas-wrapper vertical-strip-wrapper">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="strip-canvas vertical-strip"
                            style={{ cursor: draggingItem ? 'grabbing' : 'grab' }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        />
                    </div>

                    <button
                        onClick={handleFinalizeStrip}
                        disabled={photoLayers.length < 3 || isFinalizing}
                        className="btn btn-success"
                        style={{ marginTop: '15px' }}
                    >
                        {isFinalizing ? 'Finalizing & Saving...' : 'Finalize Strip'}
                    </button>
                </div>
            </div>

            <div className="projects-section" style={{ marginTop: '40px' }}>
                <h3 className="section-title">Photostrips</h3>
                {projects.length === 0 ? (
                    <p style={{ color: '#777' }}>No finalized strips yet.</p>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => {
                            const pId = project._id || project.id;
                            return (
                                <div key={pId} className="project-card" onMouseLeave={() => setOpenMenuId(null)}>
                                    <img src={project.imageUrl} alt="Photobooth Strip" className="project-thumb" />
                                    <div className="project-overlay">
                                        <button
                                            className="three-dots-btn"
                                            onClick={() => setOpenMenuId(openMenuId === pId ? null : pId)}
                                        >
                                            •••
                                        </button>
                                        {openMenuId === pId && (
                                            <div className="project-dropdown">
                                                <button onClick={() => handleDownloadProject(project.imageUrl)}>Save</button>
                                                <button onClick={() => handleEmailProject(pId)}>Email</button>
                                                <button className="delete-option" onClick={() => handleDeleteProject(project)}>Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
