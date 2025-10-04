const express = require('express');
const router = express.Router();
const WhatsAppService = require('../middleware/whatsappService');
const { adminAuth } = require('../middleware/auth'); 

const whatsappService = new WhatsAppService();
 
router.post('/product-inquiry', async (req, res) => {
    try {
        const { productId, userPhone, userName, userEmail } = req.body;

        if (!productId || !userPhone) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and phone number are required'
            });
        }

        const result = await whatsappService.handleProductInquiry(
            productId,
            null, 
            userPhone,
            { name: userName, email: userEmail }
        );

        res.json(result);

    } catch (error) {
        console.error('Product inquiry error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing product inquiry',
            error: error.message
        });
    }
});
 
router.post('/bulk-inquiry', async (req, res) => { 
    try {
        const { cartItems, userPhone, userName, userEmail } = req.body; 

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items are required for bulk inquiry'
            });
        }

        if (!userPhone) {
            return res.status(400).json({
                success: false,
                message: 'Client phone number is required'
            });
        }

        const result = await whatsappService.sendCartSummaryToClient(
            userPhone,
            cartItems 
        );

        res.json({
            success: true,
            message: 'Cart summary sent to your WhatsApp',
            data: result
        });

    } catch (error) {
        console.error('Bulk inquiry / Send Cart Summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing bulk inquiry / cart summary',
            error: error.message
        });
    }
});
 
router.post('/send-message', adminAuth, async (req, res) => {
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
            data: result
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
}); 
router.get('/credits', adminAuth, async (req, res) => {
    try {
        const credits = await whatsappService.checkCredits();
        res.json({
            success: true,
            data: credits
        });
    } catch (error) {
        console.error('Credits check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking credits',
            error: error.message
        });
    }
});

module.exports = router;