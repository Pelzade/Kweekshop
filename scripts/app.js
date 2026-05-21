// Main application controller
class KweekShopApp {
    constructor() {
        this.utils = new Utils();
        this.authManager = null;
        this.dashboardManager = null;
        this.showcaseManager = null;
        this.showcasePreviewActive = false;
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
            } else if (event === 'SIGNED_OUT') {
                this.authManager.currentUser = null;
                this.authManager.updateUI();
                this.showLandingPage();
                this.showNotification('Successfully logged out.', 'success');
            }
        });
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