// Authentication management
class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.isLoginMode = true;
    }

    initialize() {
        console.log('🔐 Initializing AuthManager...');
        this.initializeEventListeners();
        this.setupAuthStateListener();
    }

    initializeEventListeners() {
        console.log('🔐 Setting up auth event listeners...');
        
        // Navigation buttons - direct assignment
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.onclick = () => this.openAuthModal(true);
            console.log('✅ Login button attached');
        }
        
        if (signupBtn) {
            signupBtn.onclick = () => this.openAuthModal(false);
            console.log('✅ Signup button attached');
        }
        
        if (logoutBtn) {
            logoutBtn.onclick = () => this.signOut();
            console.log('✅ Logout button attached');
        }
        
        // Landing page hero buttons
        const heroSignupBtn = document.getElementById('heroSignupBtn');
        const heroLoginBtn = document.getElementById('heroLoginBtn');
        
        if (heroSignupBtn) {
            heroSignupBtn.onclick = () => this.openAuthModal(false);
            console.log('✅ Hero Signup button attached');
        }
        
        if (heroLoginBtn) {
            heroLoginBtn.onclick = () => this.openAuthModal(true);
            console.log('✅ Hero Login button attached');
        }
        
        // Auth form
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.onsubmit = (e) => this.handleAuth(e);
            console.log('✅ Auth form attached');
        }
        
        // Auth mode switch
        const switchLink = document.getElementById('switchToSignup');
        if (switchLink) {
            switchLink.onclick = (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            };
            console.log('✅ Switch link attached');
        }
        
        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeAuthModal();
            console.log('✅ Close button attached');
        }
        
        // Close modal when clicking outside
        window.onclick = (e) => {
            const modal = document.getElementById('authModal');
            if (e.target === modal) {
                this.closeAuthModal();
            }
        };
        
        console.log('✅ All auth event listeners setup complete');
    }

    setupAuthStateListener() {
        if (!this.app.utils.supabase) {
            console.log('❌ Supabase not available for auth listener');
            return;
        }

        this.app.utils.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                this.currentUser = session.user;
                this.updateUI();
                this.app.showDashboard();
                this.app.showNotification('Welcome to KweekShop!', 'success');
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.updateUI();
                this.app.showLandingPage();
                this.app.showNotification('Successfully logged out.', 'success');
            }
        });
    }

    openAuthModal(isLogin = true) {
        console.log('🔐 Opening auth modal:', isLogin ? 'Login' : 'Signup');
        
        this.isLoginMode = isLogin;
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authTitle');
        const submitBtn = document.getElementById('authSubmit');
        const authSwitchText = document.getElementById('authSwitchText');
        const switchLink = document.getElementById('switchToSignup');

        if (!modal) {
            console.log('❌ Auth modal not found');
            return;
        }

        if (isLogin) {
            if (title) title.textContent = 'Login to KweekShop';
            if (submitBtn) submitBtn.textContent = 'Login';
            if (authSwitchText) authSwitchText.textContent = "Don't have an account? ";
            if (switchLink) switchLink.textContent = 'Sign up';
        } else {
            if (title) title.textContent = 'Create Your KweekShop Account';
            if (submitBtn) submitBtn.textContent = 'Sign Up';
            if (authSwitchText) authSwitchText.textContent = "Already have an account? ";
            if (switchLink) switchLink.textContent = 'Login';
        }

        modal.style.display = 'block';
        
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        const authForm = document.getElementById('authForm');
        
        if (modal) modal.style.display = 'none';
        if (authForm) authForm.reset();
        
        console.log('🔐 Auth modal closed');
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        this.openAuthModal(this.isLoginMode);
    }

    async handleAuth(e) {
        e.preventDefault();
        console.log('🔐 Handling auth form submission');
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const submitBtn = document.getElementById('authSubmit');

        if (!email || !password) {
            this.app.showNotification('Please fill in all fields.', 'error');
            return;
        }

        if (!this.app.utils.validateEmail(email)) {
            this.app.showNotification('Please enter a valid email address.', 'error');
            return;
        }

        if (password.length < 6) {
            this.app.showNotification('Password must be at least 6 characters long.', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = this.isLoginMode ? 'Logging in...' : 'Creating Account...';
        }

        try {
            console.log('🔐 Attempting authentication...');
            let result;
            
            if (this.isLoginMode) {
                result = await this.app.utils.supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password
                });
            } else {
                result = await this.app.utils.supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        data: {
                            created_at: new Date().toISOString()
                        },
                        redirectTo: 'http://127.0.0.1:5500'
                    }
                });
            }

            if (result.error) {
                throw result.error;
            }

            if (this.isLoginMode) {
                this.app.showNotification('Successfully logged in!', 'success');
                this.closeAuthModal();
            } else {
    // Check if email confirmation is required
    if (result.data.user && result.data.user.identities && result.data.user.identities.length === 0) {
        this.app.showNotification('Email already exists. Please login instead.', 'error');
    } else {
        this.app.showNotification('Sign up successful! Please login.', 'success');
    }
    this.closeAuthModal();
}

        } catch (error) {
            console.error('🔐 Auth error:', error);
            this.app.showNotification(
                error.message || `Failed to ${this.isLoginMode ? 'login' : 'sign up'}. Please try again.`,
                'error'
            );
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = this.isLoginMode ? 'Login' : 'Sign Up';
            }
        }
    }

    async signOut() {
        try {
            console.log('🔐 Signing out...');
            const { error } = await this.app.utils.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.updateUI();
            this.app.showLandingPage();
        } catch (error) {
            console.error('🔐 Sign out error:', error);
            this.app.showNotification('Failed to log out. Please try again.', 'error');
        }
    }

    updateUI() {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userEmail = document.getElementById('userEmail');

        if (this.currentUser) {
            if (navAuth) navAuth.style.display = 'none';
            if (navUser) navUser.style.display = 'flex';
            if (userEmail) userEmail.textContent = this.currentUser.email;
        } else {
            if (navAuth) navAuth.style.display = 'flex';
            if (navUser) navUser.style.display = 'none';
        }
    }
}
