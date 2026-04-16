import {
    initializeFirebase,
    onAuthChange,
    logoutUser,
    updateUserLastSeen,
    upsertCurrentUserProfile,
    savePushSubscription
} from './firebase.js';
import { firebaseConfig } from './config.js';
import AuthManager from './auth.js';
import MessageManager from './messaging.js';

class App {
    constructor() {
        this.authManager = null;
        this.messageManager = null;
        this.currentUser = null;
        this.lastSeenIntervalId = null;
        this.boundLogoutHandler = () => this.handleLogout();
        this.boundEditUsernameHandler = () => this.handleUsernameEdit();

        this.init();
    }

    async init() {
        // Initialize Firebase
        const initialized = initializeFirebase(firebaseConfig);
        if (!initialized) {
            alert('Failed to initialize Firebase. Please check your configuration.');
            return;
        }

        // Setup auth manager
        this.authManager = new AuthManager();

        // Setup logout button once
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.boundLogoutHandler);
        }

        const editUsernameBtn = document.getElementById('edit-username-btn');
        if (editUsernameBtn) {
            editUsernameBtn.addEventListener('click', this.boundEditUsernameHandler);
        }

        // Setup auth state listener
        onAuthChange(async (user) => {
            if (user) {
                try {
                    this.currentUser = user;
                    this.authManager.setAuthLoadingState(true, 'Loading conversations...');

                    await upsertCurrentUserProfile(user);
                    await this.authManager.loadUserInfo();

                    if (this.messageManager) {
                        this.messageManager.destroy();
                        this.messageManager = null;
                    }

                    this.messageManager = new MessageManager(user, this.authManager);
                    await this.messageManager.initialize();

                    await this.syncPushSubscriptionIfPwa(user.uid);

                    this.authManager.showMessagingScreen();
                    this.startLastSeenTicker(user.uid);
                } catch (error) {
                    console.error('Session bootstrap failed:', error);
                    this.currentUser = null;
                    this.authManager.showAuthScreen();
                    this.authManager.setAuthError('Login succeeded, but loading chats failed. Please retry.');
                }
            } else {
                this.currentUser = null;
                this.authManager.showAuthScreen();
                this.stopLastSeenTicker();

                // Clean up message manager
                if (this.messageManager) {
                    this.messageManager.destroy();
                    this.messageManager = null;
                }
            }
        });

        // Keep HMR and fresh assets in development by disabling any previously installed SW.
        if (import.meta.env.DEV) {
            await this.disableServiceWorkerForDev();
        } else {
            this.registerServiceWorker();
        }

        // Setup PWA install prompt
        this.setupPWAInstall();
    }

    startLastSeenTicker(uid) {
        this.stopLastSeenTicker();

        this.lastSeenIntervalId = setInterval(() => {
            updateUserLastSeen(uid);
        }, 30000);

        updateUserLastSeen(uid);
    }

    stopLastSeenTicker() {
        if (this.lastSeenIntervalId) {
            clearInterval(this.lastSeenIntervalId);
            this.lastSeenIntervalId = null;
        }
    }

    async handleLogout() {
        const shouldLogout = await this.showConfirmDialog({
            title: 'Log Out?',
            message: 'You will need to sign in again to continue.',
            confirmLabel: 'Log Out',
            cancelLabel: 'Cancel'
        });

        if (!shouldLogout) {
            return;
        }

        const result = await logoutUser();
        if (!result.success) {
            await this.showAlertDialog('Logout Failed', result.error || 'An unknown error occurred.');
        }
    }

    async handleUsernameEdit() {
        if (!this.currentUser) {
            return;
        }

        const currentDisplayName = this.authManager.getDisplayName();
        const newUsername = await this.showUsernameDialog(currentDisplayName);
        if (newUsername === null) {
            return;
        }

        const result = await this.authManager.changeUsername(newUsername);
        if (!result.success) {
            await this.showAlertDialog('Username Update Failed', result.error || 'Could not update username.');
            return;
        }

        if (this.messageManager) {
            this.messageManager.refreshLocalUsername(newUsername);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator && import.meta.env.PROD) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async disableServiceWorkerForDev() {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                const spsCaches = cacheNames.filter((cacheName) => cacheName.startsWith('sps-cache'));
                await Promise.all(spsCaches.map((cacheName) => caches.delete(cacheName)));
            }

            console.log('Service workers disabled for development.');
        } catch (error) {
            console.warn('Failed to disable service worker in development:', error);
        }
    }

    async syncPushSubscriptionIfPwa(uid) {
        if (!uid || !this.isStandalonePwa()) {
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription = await registration.pushManager.getSubscription();
            if (!existingSubscription) {
                return;
            }

            const saveResult = await savePushSubscription(uid, existingSubscription.toJSON());
            if (!saveResult.success) {
                console.warn('Push subscription sync failed:', saveResult.error);
            }
        } catch (error) {
            console.warn('Push subscription sync failed:', error);
        }
    }

    isStandalonePwa() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    async showConfirmDialog({ title, message, confirmLabel, cancelLabel }) {
        const action = await this.openModal({
            title,
            contentHtml: `<p>${this.escapeHtml(message)}</p>`,
            actions: [
                { id: 'cancel', label: cancelLabel, className: 'btn btn-secondary' },
                { id: 'confirm', label: confirmLabel, className: 'btn btn-primary' }
            ]
        });

        return action === 'confirm';
    }

    async showAlertDialog(title, message) {
        await this.openModal({
            title,
            contentHtml: `<p>${this.escapeHtml(message)}</p>`,
            actions: [
                { id: 'ok', label: 'OK', className: 'btn btn-primary' }
            ]
        });
    }

    async showUsernameDialog(currentName = '') {
        const safeName = this.escapeHtml(currentName);

        const result = await this.openModal({
            title: 'Change Username',
            contentHtml: `
                <label for="username-input" style="display:block; margin-bottom:8px; color: var(--text-primary); font-weight: 500;">Username</label>
                <input id="username-input" type="text" maxlength="30" value="${safeName}" style="width:100%;" />
                <p id="username-modal-error" style="margin-top:8px; min-height:16px; color: var(--error); font-size:13px;"></p>
            `,
            actions: [
                { id: 'cancel', label: 'Cancel', className: 'btn btn-secondary' },
                { id: 'save', label: 'Save', className: 'btn btn-primary' }
            ],
            onOpen: (modal) => {
                const input = modal.querySelector('#username-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            },
            onAction: (action, modal, close) => {
                if (action !== 'save') {
                    close(null);
                    return;
                }

                const input = modal.querySelector('#username-input');
                const errorEl = modal.querySelector('#username-modal-error');
                const username = input?.value?.trim() || '';

                if (username.length < 3) {
                    if (errorEl) {
                        errorEl.textContent = 'Username must be at least 3 characters.';
                    }
                    return;
                }

                if (username.length > 30) {
                    if (errorEl) {
                        errorEl.textContent = 'Username must be 30 characters or less.';
                    }
                    return;
                }

                close(username);
            }
        });

        return result;
    }

    openModal({ title, contentHtml, actions, onOpen, onAction }) {
        const modal = document.getElementById('modal');
        const backdrop = document.getElementById('modal-backdrop');

        if (!modal || !backdrop) {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            const actionsMarkup = (actions || [])
                .map((action) => `<button class="${action.className}" data-modal-action="${action.id}">${this.escapeHtml(action.label)}</button>`)
                .join('');

            modal.innerHTML = `
                <div class="modal-header">${this.escapeHtml(title)}</div>
                <div class="modal-content">${contentHtml}</div>
                <div class="modal-actions">${actionsMarkup}</div>
            `;

            const close = (result) => {
                cleanup();
                resolve(result);
            };

            const handleModalClick = (event) => {
                const actionBtn = event.target.closest('[data-modal-action]');
                if (!actionBtn) {
                    return;
                }

                const actionId = actionBtn.getAttribute('data-modal-action');
                if (typeof onAction === 'function') {
                    onAction(actionId, modal, close);
                    return;
                }

                close(actionId);
            };

            const handleBackdropClick = () => {
                close(null);
            };

            const handleEscapeKey = (event) => {
                if (event.key === 'Escape') {
                    close(null);
                }
            };

            const cleanup = () => {
                modal.removeEventListener('click', handleModalClick);
                backdrop.removeEventListener('click', handleBackdropClick);
                document.removeEventListener('keydown', handleEscapeKey);

                modal.classList.remove('active');
                backdrop.classList.remove('active');
                modal.innerHTML = '';
            };

            modal.addEventListener('click', handleModalClick);
            backdrop.addEventListener('click', handleBackdropClick);
            document.addEventListener('keydown', handleEscapeKey);

            modal.classList.add('active');
            backdrop.classList.add('active');

            if (typeof onOpen === 'function') {
                onOpen(modal);
            }
        });
    }

    escapeHtml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

//     showConfigDialog() {
//         const modal = document.getElementById('modal');
//         const backdrop = document.getElementById('modal-backdrop');

//         modal.innerHTML = `
//             <div class="modal-header">Firebase Configuration Required</div>
//             <div class="modal-content">
//                 <p>Please update your Firebase configuration in <code>src/config.js</code> with your Firebase project credentials:</p>
//                 <ol style="margin: 16px 0; padding-left: 20px; color: var(--text-secondary);">
//                     <li>Go to <a href="https://console.firebase.google.com" target="_blank" style="color: var(--primary);">Firebase Console</a></li>
//                     <li>Create or select your project</li>
//                     <li>Copy your project settings</li>
//                     <li>Update the firebaseConfig object in src/config.js</li>
//                     <li>Refresh this page</li>
//                 </ol>
//             </div>
//             <div class="modal-actions">
//                 <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
//             </div>
//         `;

//         modal.classList.add('active');
//         backdrop.classList.add('active');
//     }
 }

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
