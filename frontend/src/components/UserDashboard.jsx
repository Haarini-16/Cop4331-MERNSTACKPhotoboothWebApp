import React, { useState, useRef, useEffect, useCallback } from 'react';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import { uploadImageToCloud, deleteImageFromCloud } from '../utils/CloudinaryUtil';

export default function UserDashboard() {
    const API_BASE_URL = 'http://147.182.191.129:5000/api';
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");

    // photostrip dimensions
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 1800;
    const SLOT_HEIGHT = 500;

    // Navigation & UI States
    const [activeTab, setActiveTab] = useState('studio');
    const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

    // Photobooth state variables
    const [photoLayers, setPhotoLayers] = useState([]);
    const [textLayers, setTextLayers] = useState([]);
    const [newText, setNewText] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [frameImg, setFrameImg] = useState(null);
    const [draggingItem, setDraggingItem] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Projects & Gallery
    const [projects, setProjects] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Fetch existing photobooth projects
    useEffect(() => {
        if (!currentUserId) return;
        fetch(`${API_BASE_URL}/users/${currentUserId}/photobooths`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setProjects(data); })
            .catch(err => console.error("Failed to load user photobooths", err));
    }, [currentUserId, API_BASE_URL, token]);

    // Clean up camera stream on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Load image helper
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
        if (photoLayers.length >= 3) {
            showAlert('error', 'Maximum of 3 pictures allowed on a strip.');
            return;
        }
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
            showAlert('error', 'Failed to load image.');
        }
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (frameImg) {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        photoLayers.forEach(layer => {
            ctx.drawImage(layer.img, layer.x, layer.y, layer.width, layer.height);
        });

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

    const showAlert = (type, text) => {
        setAlertMessage({ type, text });
        setTimeout(() => setAlertMessage({ type: '', text: '' }), 4000);
    };

    // Camera controls
    const startLiveCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 500, height: 500 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        } catch {
            showAlert('error', 'Camera Blocked or Offline.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const captureCameraFrame = () => {
        if (photoLayers.length >= 3) return showAlert('error', "No more than 3 pictures on a strip.");
        if (!videoRef.current) return;

        const clipCanvas = document.createElement('canvas');
        clipCanvas.width = 500;
        clipCanvas.height = SLOT_HEIGHT;
        clipCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, 500, SLOT_HEIGHT);
        addPhotoLayer(clipCanvas.toDataURL('image/png'));
    };

    const processFileImport = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (photoLayers.length + files.length > 3) {
            e.target.value = null;
            return showAlert('error', "You can only have a maximum of 3 pictures on a strip.");
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => addPhotoLayer(reader.result);
            reader.readAsDataURL(file);
        });
        e.target.value = null;
    };

    const processFrameImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const img = await loadImageElement(reader.result);
            setFrameImg(img);
            showAlert('success', 'Layout template loaded successfully!');
        };
        reader.readAsDataURL(file);
    };

    const handleAddText = () => {
        if (!newText.trim()) return;
        setTextLayers(prev => [
            ...prev,
            { id: Date.now(), text: newText, x: 50, y: 50, color: textColor, fontSize: 40 }
        ]);
        setNewText('');
    };

    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

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

    const handleCanvasMouseUp = () => setDraggingItem(null);

    const handleFinalizeStrip = () => {
        if (photoLayers.length < 3) return showAlert('error', "Please include 3 pictures before finalizing.");

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

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to save to database');
                }
                const savedPhotobooth = await res.json();
                savedPhotobooth.deleteToken = cloudResult.deleteToken;

                setProjects(prev => [savedPhotobooth, ...prev]);
                showAlert('success', "Strip finalized and saved successfully!");
                setActiveTab('projects');
            } catch (err) {
                console.error(err);
                showAlert('error', "Failed to finalize strip.");
            } finally {
                setIsFinalizing(false);
            }
        }, 'image/png');
    };

    const handleDeleteProject = async (project) => {
        try {
            if (project.deleteToken) await deleteImageFromCloud(project.deleteToken);
            await fetch(`${API_BASE_URL}/photobooths/${project._id || project.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProjects(prev => prev.filter(p => (p._id || p.id) !== (project._id || project.id)));
            setOpenMenuId(null);
            showAlert('success', 'Project deleted successfully.');
        } catch {
            showAlert('error', "Failed to delete project.");
        }
    };

    const handleEmailProject = async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/photobooths/${projectId}/email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            showAlert('success', "Strip successfully sent to your email!");
            setOpenMenuId(null);
        } catch {
            showAlert('error', "Failed to send email.");
        }
    };

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
    };

    const filteredProjects = projects.filter(p => 
        (p.createdAt || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p._id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="studio-layout">
            {/* Sidebar Navigation */}
            <aside className="studio-sidebar">
                <div className="studio-brand">
                    <div className="brand-icon">📸</div>
                    <span>PhotoBoothStudio</span>
                </div>

                <div className="sidebar-section-label">Workspace</div>
                
                <button 
                    className={`sidebar-link ${activeTab === 'studio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('studio')}
                >
                    <span>🎨</span> Studio Workspace
                </button>
                <button 
                    className={`sidebar-link ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    <span>🖼️</span> My Photostrips ({projects.length})
                </button>

                <div className="sidebar-bottom">
                    <div className="studio-profile">
                        <div className="profile-avatar">U</div>
                        <div>
                            <strong>My Studio</strong>
                            <small>Active User</small>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="studio-main">
                {/* Topbar Header */}
                <header className="studio-topbar">
                    <div>
                        <div className="breadcrumb">Workspace / {activeTab.toUpperCase()}</div>
                        <h1>{activeTab === 'studio' ? 'Photobooth Studio' : 'Photostrip Gallery'}</h1>
                        <p>Design, customize, and manage your custom 2x6 photobooth strips.</p>
                    </div>
                </header>

                {/* Alerts Banner */}
                {alertMessage.text && (
                    <div className={`studio-alert ${alertMessage.type === 'success' ? 'success-alert' : 'error-alert'}`}>
                        <span>{alertMessage.type === 'success' ? '✅' : '⚠️'}</span>
                        <span>{alertMessage.text}</span>
                        <button onClick={() => setAlertMessage({ type: '', text: '' })}>×</button>
                    </div>
                )}

                {/* TAB 1: STUDIO WORKSPACE */}
                {activeTab === 'studio' && (
                    <>
                        {/* Stats Overview */}
                        <div className="studio-stats">
                            <div className="stat-card">
                                <div className="stat-icon purple">📷</div>
                                <div>
                                    <span>Photos Added</span>
                                    <h2>{photoLayers.length}/3</h2>
                                    <small>Current strip slots</small>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">✍️</div>
                                <div>
                                    <span>Text Layers</span>
                                    <h2>{textLayers.length}</h2>
                                    <small>Custom captions</small>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon red">🖼️</div>
                                <div>
                                    <span>Template</span>
                                    <h2>{frameImg ? 'Loaded' : 'Default'}</h2>
                                    <small>2x6 Layout frame</small>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Grid */}
                        <div className="workspace-grid">
                            <div className="studio-panel" style={{ padding: '25px' }}>
                                <h3 className="section-title">Camera & Inputs</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <button onClick={startLiveCamera} className="btn btn-primary" style={{ marginTop: 0 }}>Turn on Camera</button>
                                    {isCameraActive && <button onClick={stopCamera} className="btn btn-danger" style={{ marginTop: 0 }}>Turn off Camera</button>}
                                </div>

                                <video ref={videoRef} autoPlay playsInline className="video-preview" />
                                <button onClick={captureCameraFrame} className="btn btn-primary" style={{ width: '100%' }}>
                                    Capture Snap ({photoLayers.length}/3)
                                </button>

                                <h3 className="sub-title">Import Images ({photoLayers.length}/3 selected)</h3>
                                <input type="file" accept="image/*" multiple onChange={processFileImport} className="file-input" />

                                <h3 className="sub-title">Upload Layout Template (2x6)</h3>
                                <input type="file" accept="image/png" onChange={processFrameImport} className="file-input" />

                                <button onClick={() => { setPhotoLayers([]); setTextLayers([]); setFrameImg(null); }} className="btn btn-dark">
                                    Reset Canvas Workspace
                                </button>
                            </div>

                            <div className="studio-panel" style={{ padding: '25px' }}>
                                <h3 className="section-title">Strip Editor (2x6 Inches)</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter custom text..."
                                        value={newText}
                                        onChange={(e) => setNewText(e.target.value)}
                                        className="file-input"
                                        style={{ marginBottom: 0, flex: 1 }}
                                    />
                                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '45px', height: '42px', cursor: 'pointer' }} />
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
                                    style={{ marginTop: '20px', width: '100%' }}
                                >
                                    {isFinalizing ? 'Finalizing & Saving...' : 'Finalize Strip & Save'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* TAB 2: MY PHOTOSTRIPS GALLERY */}
                {activeTab === 'projects' && (
                    <div className="studio-panel">
                        <div className="panel-heading">
                            <div>
                                <h2>Finalized Photostrips</h2>
                                <p>Manage, download, email, or delete your saved booth strips.</p>
                            </div>
                            <div className="strip-count">{projects.length} Strips</div>
                        </div>

                        <div className="studio-toolbar">
                            <div className="search-wrapper">
                                <span>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search strips by ID or date..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredProjects.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#9c8185' }}>
                                <p>No finalized strips found.</p>
                            </div>
                        ) : (
                            <div className="projects-grid" style={{ padding: '25px' }}>
                                {filteredProjects.map((project) => {
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
                                                        <button onClick={() => handleDownloadProject(project.imageUrl)}>Save Strip</button>
                                                        <button onClick={() => handleEmailProject(pId)}>Email Strip</button>
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
                )}

                {/* Footer */}
                <footer className="studio-footer">
                    <span>PhotoBooth</span>
                    <span>Cloud Photobooth Platform</span>
                </footer>
            </main>
        </div>
    );
}
