import {
    loginUser,
    signupUser,
    logoutUser,
    getCurrentUser,
    getUserProfile
} from './firebase.js';

class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.authScreen = document.getElementById('auth-screen');
        this.messagingScreen = document.getElementById('messaging-screen');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    switchTab(button) {
        // Update active tab
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show/hide forms
        const tabName = button.getAttribute('data-tab');
        document.getElementById('login-form').classList.toggle('active', tabName === 'login');
        document.getElementById('signup-form').classList.toggle('active', tabName === 'signup');
        
        // Clear errors
        document.getElementById('login-error').textContent = '';
        document.getElementById('signup-error').textContent = '';
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');

        errorElement.textContent = 'Logging in...';

        const result = await loginUser(email, password);

        if (result.success) {
            errorElement.textContent = '';
            this.loginForm.reset();
            this.showMessagingScreen();
        } else {
            errorElement.textContent = result.error || 'Login failed';
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-password-confirm').value;
        const errorElement = document.getElementById('signup-error');

        // Validation
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters';
            return;
        }

        if (username.length < 3) {
            errorElement.textContent = 'Username must be at least 3 characters';
            return;
        }

        errorElement.textContent = 'Creating account...';

        const result = await signupUser(email, password, username);

        if (result.success) {
            errorElement.textContent = '';
            this.signupForm.reset();
            this.showMessagingScreen();
        } else {
            errorElement.textContent = result.error || 'Signup failed';
        }
    }

    showMessagingScreen() {
        this.authScreen.classList.remove('active');
        this.messagingScreen.classList.add('active');
    }

    showAuthScreen() {
        this.authScreen.classList.add('active');
        this.messagingScreen.classList.remove('active');
    }

    async loadUserInfo() {
        const user = getCurrentUser();
        if (user) {
            const profile = await getUserProfile(user.uid);
            if (profile) {
                document.getElementById('user-name').textContent = profile.username || user.email;
                const initials = (profile.username || user.email)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                document.getElementById('user-avatar').textContent = initials;
            }
        }
    }
}

export default AuthManager;
