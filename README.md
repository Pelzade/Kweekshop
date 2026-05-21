# KweekShop

A dead-simple tool for small business owners and service providers to create beautiful product showcase pages that connect directly to WhatsApp.

## Features

- **Easy Setup**: Create your showcase in minutes
- **Multi-Currency Support**: USD, NGN, GHS, XOF with proper symbols
- **WhatsApp Integration**: Direct customer inquiries to WhatsApp
- **SEO-Friendly URLs**: Shareable links include business name
- **Mobile Responsive**: Works perfectly on all devices
- **Secure**: Built with security best practices

## Setup Instructions

### 1. Supabase Configuration

1. Create a new project at [Supabase](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Update `utils.js` with your Supabase credentials:

```javascript
const supabaseUrl = "your-supabase-project-url";
const supabaseKey = "your-supabase-anon-key";
```
