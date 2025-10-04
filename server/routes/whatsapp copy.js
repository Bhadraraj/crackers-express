const express = require('express');
const router = express.Router();
const WhatsAppService = require('../middleware/whatsappService');

// Initialize WhatsApp service
const whatsappService = new WhatsAppService();

// Test endpoint for WhatsApp service
router.get('/test', async (req, res) => {
    try {
        console.log('WhatsApp test endpoint hit');
        
        // Test credentials first
        const credentialTest = await whatsappService.testCredentials();
        
        res.json({
            success: true,
            message: 'WhatsApp service is working',
            credentials: credentialTest
        });
    } catch (error) {
        console.error('WhatsApp test failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'WhatsApp service test failed',
            error: error.message
        });
    }
});

// Discover working API configuration
router.get('/discover', async (req, res) => {
    try {
        console.log('WhatsApp API discovery endpoint hit');
        
        const discovery = await whatsappService.discoverWorkingAPI();
        
        res.json({
            success: true,
            message: 'API discovery completed',
            discovery: discovery
        });
    } catch (error) {
        console.error('WhatsApp API discovery failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'API discovery failed',
            error: error.message
        });
    }
});

// Send message endpoint
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }
        
        const result = await whatsappService.sendMessage(phoneNumber, message);
        
        res.json({
            success: true,
            message: 'Message sent successfully',
            result: result
        });
    } catch (error) {
        console.error('Send message failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Handle product inquiry
router.post('/product-inquiry', async (req, res) => {
    try {
        const { productId, userId, userPhone, userInfo } = req.body;
        
        if (!productId || !userPhone) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and user phone are required'
            });
        }
        
        const result = await whatsappService.handleProductInquiry(
            productId, 
            userId, 
            userPhone, 
            userInfo
        );
        
        res.json({
            success: true,
            message: 'Product inquiry sent successfully',
            result: result
        });
    } catch (error) {
        console.error('Product inquiry failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send product inquiry',
            error: error.message
        });
    }
});

// Send cart summary
router.post('/cart-summary', async (req, res) => {
    try {
        const { clientPhoneNumber, cartItems } = req.body;
        
        if (!clientPhoneNumber || !cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({
                success: false,
                message: 'Client phone number and cart items array are required'
            });
        }
        
        const result = await whatsappService.sendCartSummaryToClient(
            clientPhoneNumber, 
            cartItems
        );
        
        res.json({
            success: true,
            message: 'Cart summary sent successfully',
            result: result
        });
    } catch (error) {
        console.error('Cart summary failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send cart summary',
            error: error.message
        });
    }
});

// Health check for WhatsApp service
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'WhatsApp service is running',
        timestamp: new Date().toISOString(),
        config: {
            hasApiSecret: !!process.env.SMSQUICKER_API_SECRET,
            hasAdminNumber: !!process.env.ADMIN_WHATSAPP_NUMBER,
            baseUrl: 'https://smsquicker.com/api'
        }
    });
});

module.exports = router;