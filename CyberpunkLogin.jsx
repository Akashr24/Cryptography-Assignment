import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import PlayfairCipher from './PlayfairCipher';
import './CyberpunkLogin.css';

export default function CyberpunkLogin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const canvasContainerRef = useRef(null);
    const cardRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const SCALE_STEP = 0.1;
    const MAX_SCALE = 2.0;
    const MIN_SCALE = 0.5;

    // --- THREE.JS BACKGROUND SCENE ---
    useEffect(() => {
        if (isLoggedIn) return;

        const container = canvasContainerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020208, 0.018);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 0;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        function createNumberTexture(char) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 64, 64);

            ctx.font = 'Bold 48px monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fillText(char, 32, 32);

            return new THREE.CanvasTexture(canvas);
        }

        const numberTextures = [];
        for (let i = 0; i <= 9; i++) {
            numberTextures.push(createNumberTexture(i.toString()));
        }

        const particleCount = 1200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const tunnelRadius = 12;
        const tunnelLength = 200;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = tunnelRadius + (Math.random() - 0.5) * 4;

            const z = -Math.random() * tunnelLength;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const mixRatio = Math.random();
            colors[i * 3] = THREE.MathUtils.lerp(0.0, 0.44, mixRatio);
            colors[i * 3 + 1] = THREE.MathUtils.lerp(0.94, 0.0, mixRatio);
            colors[i * 3 + 2] = 1.0;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 1.2,
            map: numberTextures[Math.floor(Math.random() * numberTextures.length)],
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);

        const lightningCount = 6;
        const lightningGroup = new THREE.Group();
        scene.add(lightningGroup);

        function createLightningPath() {
            const points = [];
            const segments = 12;
            let currentZ = 0;
            let currentAngle = Math.random() * Math.PI * 2;

            for (let i = 0; i <= segments; i++) {
                currentAngle += (Math.random() - 0.5) * 0.5;
                const r = tunnelRadius - 0.5 + (Math.random() - 0.5) * 1.5;

                const x = Math.cos(currentAngle) * r;
                const y = Math.sin(currentAngle) * r;
                const z = currentZ;

                points.push(new THREE.Vector3(x, y, z));
                currentZ -= tunnelLength / segments;
            }
            return points;
        }

        const lightningMaterials = [];
        for (let i = 0; i < lightningCount; i++) {
            const points = createLightningPath();
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const mat = new THREE.LineBasicMaterial({
                color: Math.random() > 0.5 ? 0x00f0ff : 0x7000ff,
                transparent: true,
                opacity: Math.random() * 0.8 + 0.2,
                linewidth: 2
            });

            lightningMaterials.push(mat);
            const line = new THREE.Line(geometry, mat);
            lightningGroup.add(line);
        }

        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const speed = 0.6;
        let animationFrameId;

        function animate() {
            animationFrameId = requestAnimationFrame(animate);

            const posAttr = particleGeometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                let z = posAttr.getZ(i);
                z += speed;

                if (z > 5) {
                    z = -tunnelLength;
                }
                posAttr.setZ(i, z);
            }
            posAttr.needsUpdate = true;

            particleSystem.rotation.z += 0.002;
            lightningGroup.rotation.z -= 0.001;

            lightningMaterials.forEach((mat) => {
                if (Math.random() > 0.7) {
                    mat.opacity = Math.random() * 0.9 + 0.1;
                }
            });

            camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, -50);

            renderer.render(scene, camera);
        }

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [isLoggedIn]);

    // --- ZOOM CONTROLS ---
    const handleZoomIn = () => {
        if (scale < MAX_SCALE) {
            setScale((prev) => parseFloat((prev + SCALE_STEP).toFixed(2)));
        }
    };

    const handleZoomOut = () => {
        if (scale > MIN_SCALE) {
            setScale((prev) => parseFloat((prev - SCALE_STEP).toFixed(2)));
        }
    };

    // --- DRAGGING LOGIC ---
    const isDraggingRef = useRef(false);
    const dragPosRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

    const handleDragStart = (e) => {
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;

        const card = cardRef.current;
        if (!card) return;

        isDraggingRef.current = true;
        card.classList.add('dragging');

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        if (window.getComputedStyle(card).position !== 'absolute') {
            card.style.position = 'absolute';
            card.style.margin = '0';
            card.style.left = card.offsetLeft + 'px';
            card.style.top = card.offsetTop + 'px';
        }

        dragPosRef.current = {
            startX: clientX,
            startY: clientY,
            initialLeft: card.offsetLeft,
            initialTop: card.offsetTop
        };
    };

    useEffect(() => {
        if (isLoggedIn) return;

        const handleDrag = (e) => {
            if (!isDraggingRef.current) return;
            if (e.cancelable) e.preventDefault();

            const card = cardRef.current;
            if (!card) return;

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const diffX = clientX - dragPosRef.current.startX;
            const diffY = clientY - dragPosRef.current.startY;

            card.style.left = dragPosRef.current.initialLeft + diffX + 'px';
            card.style.top = dragPosRef.current.initialTop + diffY + 'px';
        };

        const handleDragEnd = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            const card = cardRef.current;
            if (card) {
                card.classList.remove('dragging');
            }
        };

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', handleDragEnd);

        return () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [isLoggedIn]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
            setIsLoggedIn(true);
        }
    };

    if (isLoggedIn) {
        return <PlayfairCipher onLogout={() => setIsLoggedIn(false)} />;
    }

    return (
        <div className="cyberpunk-login-wrapper">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <filter id="liquid-glass-distortion" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="92" result="noise" />
                        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                        <feDisplacementMap in="SourceGraphic" in2="blurred" scale="85" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            <div id="canvas-container" ref={canvasContainerRef}></div>

            <div className="login-overlay">
                <div
                    className="liquid-glass"
                    id="glass-card"
                    ref={cardRef}
                    style={{ '--scale-factor': scale }}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    <div className="profile-card-content">
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="username">User Identity</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter ID"
                                    required
                                    autoComplete="off"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="password">Passkey</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn-submit">Initialize</button>
                        </form>

                        <div className="zoom-controls">
                            <button className="zoom-btn" id="zoom-out" title="Decrease Size" onClick={handleZoomOut}>-</button>
                            <button className="zoom-btn" id="zoom-in" title="Increase Size" onClick={handleZoomIn}>+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
