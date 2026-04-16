import {
    loginUser,
    getCurrentUser,
    getUserProfile,
    updateUsername
} from './firebase.js';

class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.authScreen = document.getElementById('auth-screen');
        this.messagingScreen = document.getElementById('messaging-screen');
        this.loginButton = this.loginForm?.querySelector('button[type="submit"]');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        this.setAuthLoadingState(true, 'Logging in...');

        const result = await loginUser(email, password);

        if (result.success) {
            this.setAuthLoadingState(true, 'Loading conversations...');
            this.loginForm.reset();
        } else {
            this.setAuthLoadingState(false, result.error || 'Login failed');
        }
    }

    showMessagingScreen() {
        this.setAuthLoadingState(false, '');
        this.authScreen.classList.remove('active');
        this.messagingScreen.classList.add('active');
    }

    showAuthScreen() {
        this.setAuthLoadingState(false, '');
        this.authScreen.classList.add('active');
        this.messagingScreen.classList.remove('active');
    }

    setAuthLoadingState(isLoading, message = '') {
        if (this.loginButton) {
            this.loginButton.disabled = isLoading;
            this.loginButton.textContent = isLoading ? 'Please wait...' : 'Login';
        }

        if (this.loginError) {
            this.loginError.textContent = message;
        }
    }

    setAuthError(message) {
        this.setAuthLoadingState(false, message || '');
    }

    async loadUserInfo() {
        const user = getCurrentUser();
        if (!user) {
            return null;
        }

        const profile = await getUserProfile(user.uid);
        const fallbackName = this.getFallbackUsername(user.email);
        const displayName = profile?.username || fallbackName;

        this.setDisplayName(displayName);
        return { profile, displayName };
    }

    getDisplayName() {
        return document.getElementById('user-name')?.textContent?.trim() || '';
    }

    setDisplayName(name) {
        const normalizedName = (name || '').trim() || 'User';
        const userNameElement = document.getElementById('user-name');
        const avatarElement = document.getElementById('user-avatar');

        if (userNameElement) {
            userNameElement.textContent = normalizedName;
        }

        if (avatarElement) {
            const initials = normalizedName
                .split(' ')
                .filter(Boolean)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U';

            avatarElement.textContent = initials;
        }
    }

    async changeUsername(newUsername) {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not signed in.' };
        }

        const normalizedUsername = (newUsername || '').trim();
        if (normalizedUsername.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters.' };
        }

        if (normalizedUsername.length > 30) {
            return { success: false, error: 'Username must be 30 characters or less.' };
        }

        const result = await updateUsername(user.uid, normalizedUsername);
        if (result.success) {
            this.setDisplayName(normalizedUsername);
        }

        return result;
    }

    getFallbackUsername(email = '') {
        const namePart = (email.split('@')[0] || '').trim();
        return namePart || 'User';
    }
}

export default AuthManager;
