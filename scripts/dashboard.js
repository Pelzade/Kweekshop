// Dashboard management
class DashboardManager {
    constructor(app) {
        this.app = app;
        this.currentBusiness = null;
        this.products = [];
        this.maxProducts = 8;
        this.logoFile = null;
        this.currentView = 'grid';
    }

    initialize() {
        this.initializeEventListeners();
        this.loadSavedViewPreference();
        this.applyViewStyle(); // Apply saved view on load
    }

    initializeEventListeners() {
        // Business form
        const businessForm = document.getElementById('businessForm');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => this.saveBusinessInfo(e));
        }
        
        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.addProduct(e));
        }
        
        // Share link
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        }
        
        // Logo upload
        const businessLogo = document.getElementById('businessLogo');
        if (businessLogo) {
            businessLogo.addEventListener('change', (e) => this.handleLogoUpload(e));
        }
        
        const removeLogoBtn = document.getElementById('removeLogoBtn');
        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => this.removeLogo());
        }
        
        // Preview button
        this.setupPreviewButton();
        
        // View toggle buttons
        this.setupViewToggle();
    }

    loadSavedViewPreference() {
        const savedView = localStorage.getItem('kweekshop_view_preference');
        if (savedView === 'grid' || savedView === 'list') {
            this.currentView = savedView;
        }
    }

    setupViewToggle() {
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                if (this.currentView === 'grid') return;
                this.currentView = 'grid';
                this.applyViewStyle();
                localStorage.setItem('kweekshop_view_preference', 'grid');
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                if (this.currentView === 'list') return;
                this.currentView = 'list';
                this.applyViewStyle();
                localStorage.setItem('kweekshop_view_preference', 'list');
            });
        }
    }

    applyViewStyle() {
        const productsList = document.getElementById('productsList');
        if (!productsList) return;
        
        // Update button active states
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (this.currentView === 'grid') {
            productsList.classList.remove('list-view');
            productsList.classList.add('grid-view');
            if (gridBtn) gridBtn.classList.add('active');
            if (listBtn) listBtn.classList.remove('active');
        } else {
            productsList.classList.remove('grid-view');
            productsList.classList.add('list-view');
            if (listBtn) listBtn.classList.add('active');
            if (gridBtn) gridBtn.classList.remove('active');
        }
    }

    setupPreviewButton() {
        const previewBtn = document.getElementById('previewShopBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewShop());
        }
    }

    previewShop() {
        if (!this.currentBusiness) {
            this.app.showNotification('Please save your business information first.', 'error');
            return;
        }

        if (this.products.length === 0) {
            this.app.showNotification('Add at least one product to preview your shop.', 'error');
            return;
        }

        this.app.showShowcasePreview(this.currentBusiness, this.products);
    }

    async loadUserData() {
        if (!this.app.authManager.currentUser) return;
        
        try {
            await this.loadBusinessInfo();
            await this.loadProducts();
            this.updateShareLink();
            this.updateProductCounter();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadBusinessInfo() {
        const { data, error } = await this.app.utils.supabase
            .from('businesses')
            .select('*')
            .eq('user_id', this.app.authManager.currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (data) {
            this.currentBusiness = data;
            this.populateBusinessForm(data);
        }
    }

    populateBusinessForm(business) {
        const businessName = document.getElementById('businessName');
        const businessDescription = document.getElementById('businessDescription');
        const whatsappNumber = document.getElementById('whatsappNumber');
        const businessCurrency = document.getElementById('businessCurrency');
        
        if (businessName) businessName.value = this.app.utils.sanitizeInput(business.name || '');
        if (businessDescription) businessDescription.value = this.app.utils.sanitizeInput(business.description || '');
        if (whatsappNumber) whatsappNumber.value = this.app.utils.sanitizeInput(business.whatsapp_number || '');
        if (businessCurrency) businessCurrency.value = business.currency || 'USD';
        
        if (business.logo_url) {
            const logoPreview = document.getElementById('logoPreview');
            const logoPreviewImage = document.getElementById('logoPreviewImage');
            if (logoPreview && logoPreviewImage) {
                logoPreviewImage.src = business.logo_url;
                logoPreview.style.display = 'block';
            }
        }
    }

    async handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            this.app.utils.validateLogoFile(file, 100 * 1024);
            
            const logoPreview = document.getElementById('logoPreview');
            const logoPreviewImage = document.getElementById('logoPreviewImage');
            
            if (logoPreview && logoPreviewImage) {
                await this.app.utils.createLogoPreview(file, logoPreview, logoPreviewImage);
                this.logoFile = file;
                this.app.showNotification('Logo preview created. Save business info to upload.', 'success');
            }
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
            e.target.value = '';
        }
    }

    removeLogo() {
        const logoPreview = document.getElementById('logoPreview');
        const logoInput = document.getElementById('businessLogo');
        const logoPreviewImage = document.getElementById('logoPreviewImage');
        
        if (logoPreview) logoPreview.style.display = 'none';
        if (logoPreviewImage) logoPreviewImage.src = '';
        if (logoInput) logoInput.value = '';
        this.logoFile = null;
        
        if (this.currentBusiness && this.currentBusiness.logo_url) {
            this.logoFile = 'remove';
        }
        
        this.app.showNotification('Logo removed', 'info');
    }

    async uploadLogo() {
        if (!this.logoFile || this.logoFile === 'remove') {
            return this.logoFile === 'remove' ? null : this.currentBusiness?.logo_url;
        }

        const fileExt = this.logoFile.name.split('.').pop();
        const fileName = `logos/${this.app.authManager.currentUser.id}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await this.app.utils.supabase.storage
            .from('business-assets')
            .upload(fileName, this.logoFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = this.app.utils.supabase.storage
            .from('business-assets')
            .getPublicUrl(fileName);

        return publicUrl;
    }

    async deleteLogo(logoUrl) {
        if (!logoUrl) return;
        
        try {
            const filePath = logoUrl.split('/').pop();
            const fullPath = `logos/${this.app.authManager.currentUser.id}/${filePath}`;
            
            const { error } = await this.app.utils.supabase.storage
                .from('business-assets')
                .remove([fullPath]);
                
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting old logo:', error);
        }
    }

    validateBusinessName(name) {
        if (!name || name.trim().length < 2) {
            throw new Error('Business name must be at least 2 characters long');
        }
        return true;
    }

    async saveBusinessInfo(e) {
        e.preventDefault();
        
        const businessName = document.getElementById('businessName')?.value;
        const businessDescription = document.getElementById('businessDescription')?.value;
        const whatsappNumber = document.getElementById('whatsappNumber')?.value;
        const businessCurrency = document.getElementById('businessCurrency')?.value;

        if (!businessName?.trim() || !businessDescription?.trim() || !whatsappNumber?.trim()) {
            this.app.showNotification('Please fill in all business information fields.', 'error');
            return;
        }

        if (!this.app.utils.validatePhone(whatsappNumber)) {
            this.app.showNotification('Please enter a valid WhatsApp number.', 'error');
            return;
        }

        try {
            this.validateBusinessName(businessName);
        } catch (error) {
            this.app.showNotification(error.message, 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }

        try {
            let logoUrl = this.currentBusiness?.logo_url;
            
            if (this.logoFile) {
                if (this.logoFile === 'remove') {
                    if (this.currentBusiness?.logo_url) {
                        await this.deleteLogo(this.currentBusiness.logo_url);
                    }
                    logoUrl = null;
                } else {
                    if (this.currentBusiness?.logo_url) {
                        await this.deleteLogo(this.currentBusiness.logo_url);
                    }
                    logoUrl = await this.uploadLogo();
                }
            }

            const businessData = {
                user_id: this.app.authManager.currentUser.id,
                name: this.app.utils.sanitizeInput(businessName),
                description: this.app.utils.sanitizeInput(businessDescription),
                whatsapp_number: this.app.utils.sanitizeInput(whatsappNumber),
                currency: businessCurrency,
                logo_url: logoUrl,
                updated_at: new Date().toISOString()
            };

            let result;
            if (this.currentBusiness) {
                result = await this.app.utils.supabase
                    .from('businesses')
                    .update(businessData)
                    .eq('id', this.currentBusiness.id);
            } else {
                result = await this.app.utils.supabase
                    .from('businesses')
                    .insert([businessData]);
            }

            if (result.error) throw result.error;

            this.logoFile = null;
            await this.loadBusinessInfo();
            this.app.showNotification('Business information saved successfully!', 'success');
            this.updateShareLink();

        } catch (error) {
            console.error('Error saving business info:', error);
            this.app.showNotification('Failed to save business information. Please try again.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Business Info';
            }
        }
    }

    async addProduct(e) {
    e.preventDefault();
    
    if (this.products.length >= this.maxProducts) {
        this.app.showNotification(`Maximum ${this.maxProducts} products allowed. Please delete some products to add new ones.`, 'error');
        return;
    }

    const productName = document.getElementById('productName')?.value;
    const productPrice = document.getElementById('productPrice')?.value;
    const productDescription = document.getElementById('productDescription')?.value;
    const productImage = document.getElementById('productImage')?.files[0];

    if (!productName?.trim() || !productPrice?.trim() || !productImage) {
        this.app.showNotification('Please fill in all required fields.', 'error');
        return;
    }

    try {
        this.app.utils.validateFile(productImage, 1 * 1024 * 1024);
    } catch (error) {
        this.app.showNotification(error.message, 'error');
        return;
    }

    const submitBtn = document.getElementById('addProductBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
    }

    try {
        const imageUrl = await this.uploadProductImage(productImage);
        
        const productData = {
            user_id: this.app.authManager.currentUser.id,
            name: this.app.utils.sanitizeInput(productName),
            price: this.app.utils.sanitizeInput(productPrice),
            description: productDescription ? this.app.utils.sanitizeInput(productDescription) : null,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };

        const { data, error } = await this.app.utils.supabase
            .from('products')
            .insert([productData])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            this.app.showNotification('Database error: ' + error.message, 'error');
            return;
        }

        if (data && data.length > 0) {
            this.products.unshift(data[0]);
            this.renderProducts();
            this.updateProductCounter();
            this.applyViewStyle();
            
            // Reset form
            const productForm = document.getElementById('productForm');
            if (productForm) productForm.reset();
            
            const fileInput = document.getElementById('productImage');
            if (fileInput) fileInput.value = '';
            
            this.app.showNotification('Product added successfully!', 'success');
        } else {
            this.app.showNotification('Failed to add product. No data returned.', 'error');
        }

    } catch (error) {
        console.error('Error adding product:', error);
        this.app.showNotification(error.message || 'Failed to add product. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Product';
        }
    }
}

    async uploadProductImage(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${this.app.authManager.currentUser.id}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await this.app.utils.supabase.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = this.app.utils.supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return publicUrl;
    }

    async loadProducts() {
        const { data, error } = await this.app.utils.supabase
            .from('products')
            .select('*')
            .eq('user_id', this.app.authManager.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        this.products = data || [];
        this.renderProducts();
        this.updateProductCounter();
        this.applyViewStyle(); // Apply saved view after loading products
    }

    renderProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    const currency = this.currentBusiness?.currency || 'USD';
    
    productsList.className = `products-list ${this.currentView}-view`;
    
    if (this.products.length === 0) {
        productsList.innerHTML = `
            <div class="text-center" style="padding: 3rem; color: var(--text-secondary);">
                <h4>No products yet</h4>
                <p>Add your first product to get started!</p>
            </div>
        `;
        return;
    }

    productsList.innerHTML = this.products.map(product => `
        <div class="product-item" data-product-id="${product.id}">
            <div class="product-item-header">
                <div>
                    <h4>${this.app.utils.sanitizeInput(product.name)}</h4>
                    <div class="price">${this.app.utils.formatPrice(product.price, currency)}</div>
                    ${product.description ? `<p class="product-description">${this.app.utils.sanitizeInput(product.description)}</p>` : ''}
                </div>
                <button type="button" class="delete-btn" onclick="window.kweekShopApp.dashboardManager.deleteProduct('${product.id}')">
                    Delete
                </button>
            </div>
            <img src="${product.image_url}" alt="${this.app.utils.sanitizeInput(product.name)}" 
                 onerror="this.src='assets/images/placeholder.jpg'">
        </div>
    `).join('');
}

    updateProductCounter() {
        const counter = document.getElementById('productCounter');
        if (!counter) return;
        
        counter.textContent = `${this.products.length}/${this.maxProducts} products`;
        
        if (this.products.length >= this.maxProducts) {
            counter.style.background = 'var(--error-color)';
        } else if (this.products.length >= this.maxProducts - 2) {
            counter.style.background = 'var(--warning-color)';
        } else {
            counter.style.background = 'var(--success-color)';
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await this.app.utils.supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            this.products = this.products.filter(p => p.id !== productId);
            this.renderProducts();
            this.updateProductCounter();
            this.applyViewStyle(); // Re-apply view style after deletion
            this.app.showNotification('Product deleted successfully.', 'success');

        } catch (error) {
            console.error('Error deleting product:', error);
            this.app.showNotification('Failed to delete product. Please try again.', 'error');
        }
    }

    updateShareLink() {
        const shareableLink = document.getElementById('shareableLink');
        if (!shareableLink) return;
        
        if (this.app.authManager.currentUser && this.currentBusiness) {
            const shareLink = this.app.utils.generateShareableLink(
                this.app.authManager.currentUser.id, 
                this.currentBusiness.name
            );
            shareableLink.value = shareLink;
        } else {
            shareableLink.value = 'Please save your business information first';
        }
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareableLink')?.value;
        if (shareLink && shareLink !== 'Please save your business information first') {
            this.app.utils.copyToClipboard(shareLink);
        } else {
            this.app.showNotification('Please save your business information first.', 'error');
        }
    }
}
