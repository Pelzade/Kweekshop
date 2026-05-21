// Utility functions and Supabase configuration
class Utils {
    constructor() {
        this.supabase = null;
        console.log('🔧 Utils class initialized');
    }

    async initializeSupabase() {
        try {
            console.log('🔧 Initializing Supabase...');
            
            // YOUR SUPABASE CREDENTIALS
            const supabaseUrl = 'https://vtuovvnycivueogtjqow.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dW92dm55Y2l2dWVvZ3RqcW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzMwNTMsImV4cCI6MjA5NDg0OTA1M30.bGSyMKgr--Uv1HRHByWf3kijwVfMS5_2S8s_YbGajgU';
            
            this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase connected successfully');
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            throw error;
        }
    }

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number (basic international format)
    validatePhone(phone) {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Validate file type and size (1MB max)
    validateFile(file, maxSize = 1 * 1024 * 1024) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
        }
        
        if (file.size > maxSize) {
            throw new Error(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
        }
        
        return true;
    }

    // Validate logo file (100KB max)
    validateLogoFile(file, maxSize = 100 * 1024) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid logo file type. Please upload JPG, PNG, or WebP images.');
        }
        
        if (file.size > maxSize) {
            throw new Error(`Logo file size too large. Maximum size is ${maxSize / 1024}KB.`);
        }
        
        return true;
    }

    // Create logo preview
    createLogoPreview(file, previewElement, imageElement) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageElement.src = e.target.result;
                previewElement.style.display = 'block';
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Currency options
    getCurrencyOptions() {
        return [
            { code: 'USD', symbol: '$', name: 'US Dollar' },
            { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
            { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
            { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }
        ];
    }

    // Format price with currency symbol
    formatPrice(price, currency = 'USD') {
        if (!price) return 'Price not set';
        
        const currencies = {
            'USD': '$',
            'NGN': '₦',
            'GHS': '₵',
            'XOF': 'CFA '
        };
        
        const symbol = currencies[currency] || '$';
        return `${symbol}${price}`;
    }

    // Generate simple shareable link with just business name
    generateShareableLink(userId, businessName = '') {
        const baseUrl = window.location.origin + window.location.pathname;
        if (businessName) {
            const slug = businessName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            return `${baseUrl}?showcase=${slug}`;
        }
        return `${baseUrl}?showcase=${userId}`;
    }

    // Extract business slug
    extractBusinessSlug(showcaseParam) {
        return showcaseParam;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 3000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        `;
        
        if (type === 'success') {
            notification.style.background = '#10b981';
        } else if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = '#7c3aed';
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Link copied to clipboard!', 'success');
            return true;
        } catch (err) {
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('Link copied to clipboard!', 'success');
                return true;
            } catch (fallbackErr) {
                this.showNotification('Failed to copy link. Please copy manually.', 'error');
                return false;
            }
        }
    }

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if user is on mobile device
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}