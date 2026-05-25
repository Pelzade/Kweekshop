// Main application controller
class KweekShopApp {
    constructor() {
        this.utils = new Utils();
        this.authManager = null;
        this.dashboardManager = null;
        this.showcaseManager = null;
        this.showcasePreviewActive = false;
        this.inactivityTimer = null;
        this.initializeApp();
    }

    async initializeApp() {
        console.log('🚀 Starting KweekShop...');
        
        try {
            // Initialize Supabase first
            await this.utils.initializeSupabase();
            
            // Initialize managers
            this.authManager = new AuthManager(this);
            this.dashboardManager = new DashboardManager(this);
            this.showcaseManager = new ShowcaseManager(this);
            
            this.authManager.initialize();
            this.dashboardManager.initialize();
            this.showcaseManager.initialize();
            
            // Set up auth state listener
            this.setupAuthListener();
            
            // Set up auto-logout after user is authenticated
            this.setupAutoLogout();
            
            // Handle routing based on URL parameters
            this.handleRouting();
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showLandingPage();
        } finally {
            // Always hide loading screen
            this.hideLoadingScreen();
        }
    }

    setupAuthListener() {
        this.utils.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth change:', event);
            if (event === 'SIGNED_IN' && session?.user) {
                this.authManager.currentUser = session.user;
                this.authManager.updateUI();
                this.showDashboard();
                this.showNotification('Welcome to KweekShop!', 'success');
                // Reset inactivity timer when user logs in
                this.resetInactivityTimer();
            } else if (event === 'SIGNED_OUT') {
                this.authManager.currentUser = null;
                this.authManager.updateUI();
                this.showLandingPage();
                // Clear inactivity timer when user logs out
                this.clearInactivityTimer();
            }
        });
    }

    setupAutoLogout() {
        // Set up event listeners for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const resetTimer = () => {
            this.resetInactivityTimer();
        };
        
        // Add event listeners for user activity
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        
        // Also listen for dashboard-specific activity
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.addEventListener('input', resetTimer);
            dashboard.addEventListener('click', resetTimer);
        }
        
        console.log('✅ Auto-logout timer initialized - 6 hours inactivity timeout');
    }

    resetInactivityTimer() {
        // Clear existing timer
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        // Only set timer if user is logged in
        if (this.authManager && this.authManager.currentUser) {
            // 6 hours = 6 * 60 * 60 * 1000 milliseconds
            this.inactivityTimer = setTimeout(() => {
                this.autoLogout();
            }, 6 * 60 * 60 * 1000); // 6 hours
            
            console.log('🕐 Inactivity timer reset. Will logout after 6 hours of inactivity.');
        }
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
            console.log('🕐 Inactivity timer cleared');
        }
    }

    async autoLogout() {
        console.log('🕐 Auto-logout triggered due to 6 hours of inactivity');
        
        // Sign out the user (no notification)
        if (this.authManager) {
            await this.authManager.signOut();
        }
        
        // Clear the timer
        this.clearInactivityTimer();
    }

    handleRouting() {
        const urlParams = new URLSearchParams(window.location.search);
        const showcaseParam = urlParams.get('showcase');
        
        console.log('📍 Current URL params:', showcaseParam);
        
        if (showcaseParam) {
            // Always show showcase if showcase parameter exists, regardless of auth state
            this.showShowcase(showcaseParam);
        } else {
            // No showcase parameter, check auth state for default view
            this.checkAuthState();
        }
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await this.utils.supabase.auth.getSession();
            if (session?.user) {
                this.authManager.currentUser = session.user;
                this.authManager.updateUI();
                this.showDashboard();
                // Reset timer when user is already logged in
                this.resetInactivityTimer();
            } else {
                this.showLandingPage();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLandingPage();
        }
    }

    showLandingPage() {
        this.hideAllViews();
        this.showNavigation();
        this.showcasePreviewActive = false;
        const landingPage = document.getElementById('landingPage');
        if (landingPage) landingPage.style.display = 'block';
        console.log('✅ Showing landing page');
    }

    showDashboard() {
        this.hideAllViews();
        this.showNavigation();
        this.showcasePreviewActive = false;
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            // Load user data when showing dashboard
            if (this.dashboardManager) {
                this.dashboardManager.loadUserData();
            }
            // Reset inactivity timer
            this.resetInactivityTimer();
        }
        console.log('✅ Showing dashboard');
    }

    showShowcase(showcaseSlug) {
        this.hideAllViews();
        this.hideNavigation();
        this.showcasePreviewActive = false;
        const showcasePage = document.getElementById('showcasePage');
        if (showcasePage) showcasePage.style.display = 'block';
        console.log('✅ Showing showcase:', showcaseSlug);
        
        // Load showcase data
        if (this.showcaseManager) {
            this.showcaseManager.loadPublicShowcase(showcaseSlug);
        }
    }

    showShowcasePreview(business, products) {
        console.log('👁️ Showing shop preview');
        
        // Hide all views
        this.hideAllViews();
        this.hideNavigation();
        
        const showcasePage = document.getElementById('showcasePage');
        if (showcasePage) {
            showcasePage.style.display = 'block';
            
            // Load the showcase in preview mode
            if (this.showcaseManager) {
                this.showcaseManager.renderPublicShowcase(business, products, true);
            }
            
            // Store that we're in preview mode
            this.showcasePreviewActive = true;
        }
    }

    hideAllViews() {
        const views = ['landingPage', 'dashboard', 'showcasePage'];
        views.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    hideNavigation() {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'none';
    }

    showNavigation() {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'block';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen hidden');
        }
    }

    showNotification(message, type = 'info') {
        this.utils.showNotification(message, type);
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kweekShopApp = new KweekShopApp();
});

// Emergency loading screen hide after 3 seconds
setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    const landingPage = document.getElementById('landingPage');
    
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.log('🆘 Emergency: Force-hiding loading screen');
        loadingScreen.style.display = 'none';
        
        if (landingPage) {
            landingPage.style.display = 'block';
        }
    }
}, 3000);
