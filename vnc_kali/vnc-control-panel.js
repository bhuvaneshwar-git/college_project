// VNC Control Panel - Injected into noVNC
(function() {
    'use strict';
    
    console.log('🚀 VNC Control Panel Loading...');
    
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        injectControlPanel();
        setupEventListeners();
        showWelcomeModal();
        updateSessionTime();
        setInterval(updateSessionTime, 60000);
    }
    
    function injectControlPanel() {
        const controlHTML = `
            <!-- Control Bar -->
            <div class="vnc-control-bar">
                <div class="vnc-control-left">
                    <div class="vnc-status-indicator">
                        <span class="vnc-status-dot"></span>
                        <span>Session Active</span>
                    </div>
                    <div class="vnc-session-info">
                        OS: Kali Linux 
                    </div>
                </div>
                <div class="vnc-control-right">
                    <button class="vnc-btn vnc-btn-pause" id="vncPauseBtn">
                        <svg class="vnc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Pause Session
                    </button>
                    <button class="vnc-btn vnc-btn-power" id="vncPowerBtn">
                        <svg class="vnc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Power Off
                    </button>
                </div>
            </div>

            <!-- Welcome Modal -->
            <div class="vnc-modal-overlay vnc-active" id="vncWelcomeModal">
                <div class="vnc-modal vnc-welcome-modal">
                    <div class="vnc-welcome-header">
                        <div class="vnc-welcome-icon">
                            <svg width="48" height="48" fill="none" stroke="white" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="vnc-modal-title">Welcome to Your Virtual Environment</h2>
                        <p class="vnc-modal-subtitle">Important Session Information</p>
                    </div>

                    <div class="vnc-modal-content">
                        <div class="vnc-features-grid">
                            <div class="vnc-feature-card">
                                <div class="vnc-feature-icon">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div class="vnc-feature-content">
                                    <h3>Pause Session</h3>
                                    <p><strong>Your session will be preserved for 24 hours.</strong> All open applications, files, and desktop state will remain intact. After 24 hours, the session will be automatically terminated.</p>
                                </div>
                            </div>

                            <div class="vnc-feature-card">
                                <div class="vnc-feature-icon">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                </div>
                                <div class="vnc-feature-content">
                                    <h3>Power Off</h3>
                                    <p><strong>Your session will be completely terminated.</strong> All running applications will be closed. However, files saved in the "student" folder will be preserved for your next session.</p>
                                </div>
                            </div>

                            <div class="vnc-feature-card">
                                <div class="vnc-feature-icon">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                                    </svg>
                                </div>
                                <div class="vnc-feature-content">
                                    <h3>Data Persistence</h3>
                                    <p><strong>Save your work in the "student" folder</strong> on the desktop to ensure it persists across sessions. Files stored elsewhere will be lost when the session ends.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="vnc-modal-actions">
                        <button class="vnc-btn vnc-btn-confirm" id="vncWelcomeOkBtn">I Understand</button>
                    </div>
                </div>
            </div>

            <!-- Pause Modal -->
            <div class="vnc-modal-overlay" id="vncPauseModal">
                <div class="vnc-modal">
                    <div class="vnc-modal-header">
                        <h2 class="vnc-modal-title">
                            <svg class="vnc-icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Pause Session
                        </h2>
                        <p class="vnc-modal-subtitle">Temporarily suspend your virtual environment</p>
                    </div>

                    <div class="vnc-modal-content">
                        <div class="vnc-info-box vnc-warning">
                            <div class="vnc-info-item">
                                <svg class="vnc-info-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="vnc-info-text">
                                    <strong>24-Hour Preservation Window</strong><br>
                                    Your session will be paused and preserved for up to <strong>24 hours</strong>. After this period, the session will be automatically terminated and all unsaved work will be lost.
                                </div>
                            </div>
                        </div>

                        <div class="vnc-info-box">
                            <div class="vnc-info-item">
                                <svg class="vnc-info-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="vnc-info-text">
                                    <strong>What will be preserved:</strong> All open applications, browser tabs, files in memory, and desktop state will remain exactly as you left them.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="vnc-modal-actions">
                        <button class="vnc-btn vnc-btn-secondary" id="vncPauseCancelBtn">Cancel</button>
                        <button class="vnc-btn vnc-btn-confirm" id="vncPauseConfirmBtn">Pause Now</button>
                    </div>
                </div>
            </div>

            <!-- Power Off Modal -->
            <div class="vnc-modal-overlay" id="vncPowerModal">
                <div class="vnc-modal">
                    <div class="vnc-modal-header">
                        <h2 class="vnc-modal-title">
                            <svg class="vnc-icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            Power Off Session
                        </h2>
                        <p class="vnc-modal-subtitle">Completely terminate your virtual environment</p>
                    </div>

                    <div class="vnc-modal-content">
                        <div class="vnc-info-box vnc-danger">
                            <div class="vnc-info-item">
                                <svg class="vnc-info-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <div class="vnc-info-text">
                                    <strong>Warning: Session Will Be Deleted</strong><br>
                                    Powering off will <strong>completely terminate</strong> your session. All running applications will be closed and RAM will be cleared.
                                </div>
                            </div>
                        </div>

                        <div class="vnc-info-box">
                            <div class="vnc-info-item">
                                <svg class="vnc-info-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <div class="vnc-info-text">
                                    <strong>What will be saved:</strong> Any files you saved in the <strong>"student" folder</strong> on your desktop will persist and be available in your next session.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="vnc-modal-actions">
                        <button class="vnc-btn vnc-btn-secondary" id="vncPowerCancelBtn">Cancel</button>
                        <button class="vnc-btn vnc-btn-power" id="vncPowerConfirmBtn">Power Off</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', controlHTML);
        console.log('✓ Control panel injected');
    }
    
    function setupEventListeners() {
        // Pause button
        document.getElementById('vncPauseBtn')?.addEventListener('click', showPauseModal);
        document.getElementById('vncPauseCancelBtn')?.addEventListener('click', closePauseModal);
        document.getElementById('vncPauseConfirmBtn')?.addEventListener('click', confirmPause);
        
        // Power button
        document.getElementById('vncPowerBtn')?.addEventListener('click', showPowerModal);
        document.getElementById('vncPowerCancelBtn')?.addEventListener('click', closePowerModal);
        document.getElementById('vncPowerConfirmBtn')?.addEventListener('click', confirmPowerOff);
        
        // Welcome modal
        document.getElementById('vncWelcomeOkBtn')?.addEventListener('click', closeWelcomeModal);
    }
    
    function updateSessionTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeEl = document.getElementById('vncSessionTime');
        if (timeEl) {
            timeEl.textContent = `${hours}:${minutes}`;
        }
    }
    
    // Modal functions
    function showPauseModal() {
        document.getElementById('vncPauseModal')?.classList.add('vnc-active');
    }
    
    function closePauseModal() {
        document.getElementById('vncPauseModal')?.classList.remove('vnc-active');
    }
    
    function showPowerModal() {
        document.getElementById('vncPowerModal')?.classList.add('vnc-active');
    }
    
    function closePowerModal() {
        document.getElementById('vncPowerModal')?.classList.remove('vnc-active');
    }
    
    function showWelcomeModal() {
        // Check if user has seen welcome before
        if (!sessionStorage.getItem('vncWelcomeSeen')) {
            document.getElementById('vncWelcomeModal')?.classList.add('vnc-active');
        }
    }
    
    function closeWelcomeModal() {
        document.getElementById('vncWelcomeModal')?.classList.remove('vnc-active');
        sessionStorage.setItem('vncWelcomeSeen', 'true');
    }
    
    // API functions
    function getAuthToken() {
        // Try multiple sources for the token
        
        // 1. Try URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken && urlToken !== 'null' && urlToken !== 'undefined') {
            console.log('✓ Token found in URL');
            localStorage.setItem('authToken', urlToken);
            return urlToken;
        }
        
        // 2. Try localStorage
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
            console.log('✓ Token found in localStorage');
            return storedToken;
        }
        
        // 3. Try sessionStorage
        const sessionToken = sessionStorage.getItem('authToken');
        if (sessionToken && sessionToken !== 'null' && sessionToken !== 'undefined') {
            console.log('✓ Token found in sessionStorage');
            return sessionToken;
        }
        
        // 4. Try to get from parent window (if in iframe)
        try {
            if (window.parent && window.parent !== window) {
                const parentToken = window.parent.localStorage.getItem('authToken');
                if (parentToken && parentToken !== 'null' && parentToken !== 'undefined') {
                    console.log('✓ Token found in parent window');
                    localStorage.setItem('authToken', parentToken);
                    return parentToken;
                }
            }
        } catch (e) {
            // Cross-origin iframe, can't access parent
        }
        
        console.warn('⚠ No auth token found');
        return null;
    }
    
    function getOS() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('os') || 'kali';
    }
    
    async function confirmPause() {
        let token = getAuthToken();
        const os = getOS();
        
        // If no token, prompt user to enter it
        if (!token) {
            token = prompt('Please enter your authentication token:\n\n(You can find this in your browser after logging in)');
            if (!token) {
                alert('Authentication token is required to pause the session.');
                return;
            }
            // Save for future use
            localStorage.setItem('authToken', token);
        }
        
        try {
            // Get the API endpoint
            // Try to detect the correct hostname and port
            const hostname = window.location.hostname || 'localhost';
            const apiUrl = `http://${hostname}:3001/pause-container?os=${os}`;
            
            console.log('📡 Sending pause request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                
                if (response.status === 401) {
                    // Token invalid - clear it and ask again
                    localStorage.removeItem('authToken');
                    alert('Authentication failed. Your session may have expired.\n\nPlease close this window and log in again.');
                } else {
                    alert(`Failed to pause session (HTTP ${response.status})\n\nPlease try again or contact support.`);
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                closePauseModal();
                showSuccessMessage('Session Paused', 'Your session will be preserved for 24 hours.');
                setTimeout(() => {
                    // Don't close window, just show message
                    // alert('You can now close this window. Your session is paused and will be available when you log in again.');
                }, 2000);
            } else {
                alert('Failed to pause: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Pause error:', error);
            alert(`Network error: ${error.message}\n\nMake sure the backend server is running on port 3001.`);
        }
    }
    
    async function confirmPowerOff() {
        let token = getAuthToken();
        const os = getOS();
        
        // If no token, prompt user to enter it
        if (!token) {
            token = prompt('Please enter your authentication token:\n\n(You can find this in your browser after logging in)');
            if (!token) {
                alert('Authentication token is required to power off the session.');
                return;
            }
            // Save for future use
            localStorage.setItem('authToken', token);
        }
        
        try {
            const hostname = window.location.hostname || 'localhost';
            const apiUrl = `http://${hostname}:3001/stop-container?os=${os}`;
            
            console.log('📡 Sending power off request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                
                if (response.status === 401) {
                    // Token invalid - clear it and ask again
                    localStorage.removeItem('authToken');
                    alert('Authentication failed. Your session may have expired.\n\nPlease close this window and log in again.');
                } else {
                    alert(`Failed to power off session (HTTP ${response.status})\n\nPlease try again or contact support.`);
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                closePowerModal();
                showSuccessMessage('Session Terminated', 'Files in "student" folder are preserved.');
                setTimeout(() => {
                    // Don't close window, just show message
                    // alert('Session terminated. You can now close this window.');
                }, 2000);
            } else {
                alert('Failed to power off: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Power off error:', error);
            alert(`Network error: ${error.message}\n\nMake sure the backend server is running on port 3001.`);
        }
    }
    
    function showSuccessMessage(title, message) {
        const successHTML = `
            <div class="vnc-modal-overlay vnc-active" id="vncSuccessModal">
                <div class="vnc-modal" style="max-width: 400px; text-align: center;">
                    <div style="margin-bottom: 24px;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="48" height="48" fill="none" stroke="white" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">${title}</h2>
                        <p style="font-size: 14px; color: #94a3b8;">${message}</p>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">Closing window...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', successHTML);
    }
    
    console.log('✓ VNC Control Panel Ready!');
})();
