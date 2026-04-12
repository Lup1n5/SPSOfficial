import { initializeFirebase, onAuthChange, logoutUser, updateUserLastSeen } from './firebase.js';
import { firebaseConfig } from './config.js';
import AuthManager from './auth.js';
import MessageManager from './messaging.js';

class App {
    constructor() {
        this.authManager = null;
        this.messageManager = null;
        this.currentUser = null;

        this.init();
    }

    async init() {
        // Check if Firebase config is set
        if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
            this.showConfigDialog();
            return;
        }

        // Initialize Firebase
        const initialized = initializeFirebase(firebaseConfig);
        if (!initialized) {
            alert('Failed to initialize Firebase. Please check your configuration.');
            return;
        }

        // Setup auth manager
        this.authManager = new AuthManager();

        // Setup auth state listener
        onAuthChange(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.authManager.loadUserInfo();
                
                // Initialize message manager
                this.messageManager = new MessageManager(user, this.authManager);

                // Setup logout button
                document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

                // Update last seen
                setInterval(() => updateUserLastSeen(user.uid), 30000);
                updateUserLastSeen(user.uid);
            } else {
                this.currentUser = null;
                this.authManager.showAuthScreen();
                
                // Clean up message manager
                if (this.messageManager) {
                    this.messageManager.messageSubscriptions.forEach(unsub => {
                        if (unsub) unsub();
                    });
                    this.messageManager = null;
                }
            }
        });

        // Register service worker
        this.registerServiceWorker();

        // Setup PWA install prompt
        this.setupPWAInstall();
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            const result = await logoutUser();
            if (result.success) {
                // Auth state listener will handle the UI update
            } else {
                alert('Failed to logout: ' + result.error);
            }
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupPWAInstall() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show install button
            console.log('PWA install prompt available');
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            deferredPrompt = null;
        });
    }

    showConfigDialog() {
        const modal = document.getElementById('modal');
        const backdrop = document.getElementById('modal-backdrop');

        modal.innerHTML = `
            <div class="modal-header">Firebase Configuration Required</div>
            <div class="modal-content">
                <p>Please update your Firebase configuration in <code>src/config.js</code> with your Firebase project credentials:</p>
                <ol style="margin: 16px 0; padding-left: 20px; color: var(--text-secondary);">
                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" style="color: var(--primary);">Firebase Console</a></li>
                    <li>Create or select your project</li>
                    <li>Copy your project settings</li>
                    <li>Update the firebaseConfig object in src/config.js</li>
                    <li>Refresh this page</li>
                </ol>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
            </div>
        `;

        modal.classList.add('active');
        backdrop.classList.add('active');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
