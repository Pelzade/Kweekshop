// Main application controller - SIMPLIFIED VERSION
class KweekShopApp {
    constructor() {
        console.log('🚀 Creating KweekShopApp...');
        this.utils = null;
        this.authManager = null;
        this.dashboardManager = null;
        this.showcaseManager = null;
        this.initializeApp();
    }

    async initializeApp() {
        console.log('🚀 Initializing KweekShop...');
        
        try {
            // Initialize utils
            this.utils = new Utils();
            await this.utils.initializeSupabase();
            
            console.log('✅ Utils initialized, Supabase connected');
            
            // Initialize managers
            this.authManager = new AuthManager(this);
            this.dashboardManager = new DashboardManager(this);
            this.showcaseManager = new ShowcaseManager(this);
            
            this.authManager.initialize();
            this.dashboardManager.initialize();
            this.showcaseManager.initialize();
            
            console.log('✅ All managers initialized');
            
            // Check auth state
            await this.checkAuthState();
            
        } catch (error) {
            console.error('❌ App initialization error:', error);
            this.showLandingPage();
        } finally {
            this.hideLoadingScreen();
        }
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await this.utils.supabase.auth.getSession();
            console.log('📋 Session check:', session ? 'Logged in' : 'Logged out');
            
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
        const landingPage = document.getElementById('landingPage');
        if (landingPage) landingPage.style.display = 'block';
        console.log('✅ Showing landing page');
    }

    showDashboard() {
        this.hideAllViews();
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            if (this.dashboardManager) {
                this.dashboardManager.loadUserData();
            }
        }
        console.log('✅ Showing dashboard');
    }

    hideAllViews() {
        const views = ['landingPage', 'dashboard', 'showcasePage'];
        views.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen hidden');
        }
    }

    showNotification(message, type = 'info') {
        if (this.utils) {
            this.utils.showNotification(message, type);
        }
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM ready, starting app...');
    window.kweekShopApp = new KweekShopApp();
});

// Emergency fallback
setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.log('🆘 Emergency: Force-hiding loading screen');
        loadingScreen.style.display = 'none';
        const landingPage = document.getElementById('landingPage');
        if (landingPage) landingPage.style.display = 'block';
    }
}, 5000);
