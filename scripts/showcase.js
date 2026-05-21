// Showcase management
class ShowcaseManager {
    constructor(app) {
        this.app = app;
    }

    initialize() {
        // Setup navigation for showcase
        this.setupShowcaseNavigation();
    }

    setupShowcaseNavigation() {
        // Handle "Create your own shop" link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.create-shop-link') || e.target.closest('.create-shop-link')) {
                e.preventDefault();
                window.location.href = '/';
            }
        });

        // Handle back to dashboard button clicks using event delegation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.back-to-dashboard') || e.target.closest('.back-to-dashboard')) {
                e.preventDefault();
                this.app.showDashboard();
            }
        });
    }

    async loadPublicShowcase(businessSlug) {
        try {
            console.log('🛍️ Loading showcase for:', businessSlug);
            
            // Find business by name (slug)
            const businessName = businessSlug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            const { data: businesses, error: businessError } = await this.app.utils.supabase
                .from('businesses')
                .select('*')
                .ilike('name', `%${businessName}%`);

            if (businessError || !businesses || businesses.length === 0) {
                this.showShowcaseError('Showcase Not Found', 'This business showcase doesn\'t exist or has been removed.');
                return;
            }

            const business = businesses[0];
            const { data: products, error: productsError } = await this.app.utils.supabase
                .from('products')
                .select('*')
                .eq('user_id', business.user_id)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            this.renderPublicShowcase(business, products || [], false);

        } catch (error) {
            console.error('Error loading showcase:', error);
            this.showShowcaseError('Error Loading Showcase', 'There was a problem loading this showcase. Please try again later.');
        }
    }

    renderPublicShowcase(business, products, isPreview = false) {
        const showcaseHeader = document.getElementById('showcaseHeader');
        const showcaseBusinessName = document.getElementById('showcaseBusinessName');
        const showcaseDescription = document.getElementById('showcaseDescription');
        
        // Clear existing content
        showcaseHeader.innerHTML = '';
        showcaseBusinessName.textContent = '';
        showcaseDescription.textContent = '';
        
        // Add back button if in preview mode
        if (isPreview) {
            const backButton = document.createElement('button');
            backButton.className = 'btn-secondary back-to-dashboard';
            backButton.innerHTML = '← Back to Dashboard';
            showcaseHeader.appendChild(backButton);
        }
        
        // Create header content based on whether logo exists
        if (business.logo_url) {
            showcaseHeader.className = 'showcase-header with-logo';
            showcaseHeader.innerHTML += `
                <img src="${business.logo_url}" alt="${this.app.utils.sanitizeInput(business.name)}" class="showcase-logo" 
                     onerror="this.style.display='none'; document.getElementById('showcaseBusinessName').style.display='block'">
                <div class="showcase-header-text">
                    <h1 id="showcaseBusinessName" style="display: none;">${this.app.utils.sanitizeInput(business.name)}</h1>
                    <p id="showcaseDescription">${this.app.utils.sanitizeInput(business.description)}</p>
                </div>
            `;
        } else {
            showcaseHeader.className = 'showcase-header';
            showcaseHeader.innerHTML += `
                <h1 id="showcaseBusinessName">${this.app.utils.sanitizeInput(business.name)}</h1>
                <p id="showcaseDescription">${this.app.utils.sanitizeInput(business.description)}</p>
            `;
        }

        const productsGrid = document.getElementById('showcaseProducts');
        const currency = business.currency || 'USD';
        
        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem; color: white;">
                    <h3>No products available</h3>
                    <p>This showcase doesn't have any products yet.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image_url}" alt="${this.app.utils.sanitizeInput(product.name)}" 
                     onerror="this.src='assets/images/placeholder.jpg'">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <div class="price">${this.app.utils.formatPrice(product.price, currency)}</div>
                    <a href="${this.generateWhatsAppLink(business.whatsapp_number, product, currency)}" 
                       class="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                        Contact via WhatsApp
                    </a>
                </div>
            </div>
        `).join('');
        
        // Update the app's preview state
        this.app.showcasePreviewActive = isPreview;
    }

    showShowcaseError(title, message) {
        document.getElementById('showcasePage').innerHTML = `
            <div class="container">
                <div class="text-center" style="padding: 4rem 2rem; color: white;">
                    <h2 style="margin-bottom: 1rem;">${title}</h2>
                    <p>${message}</p>
                    <a href="/" class="btn-primary" style="margin-top: 2rem; display: inline-block;">Back to Home</a>
                </div>
            </div>
        `;
    }

    generateWhatsAppLink(whatsappNumber, product, currency) {
    const productImageUrl = product.image_url;
    const message = `Hi, I'm interested in this!\n\nProduct: ${product.name}\nPrice: ${this.app.utils.formatPrice(product.price, currency)}\n\nView product image: ${productImageUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
}
