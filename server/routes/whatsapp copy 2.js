// routes/whatsapp.js
const express = require("express");
const router = express.Router();
const WhatsAppService = require("../middleware/whatsappService");
const auth = require("../middleware/auth");
const whatsappService = new WhatsAppService();

router.post("/product-inquiry", auth, async (req, res) => {
  try {
    const { productId, userPhone } = req.body;
    const userId = req.user.id;

    if (!productId || !userPhone) {
      return res.status(400).json({
        success: false,
        message: "Product ID and phone number are required",
      });
    }

    const formattedPhone = whatsappService.formatPhoneNumber(userPhone);

    const result = await whatsappService.handleProductInquiry(
      productId,
      userId,
      formattedPhone
    );

    res.json(result);
  } catch (error) {
    console.error("Product inquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing product inquiry",
      error: error.message,
    });
  }
});

// Send custom WhatsApp message (admin only)
router.post("/send-message", auth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: "Phone number and message are required",
      });
    }

    const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);
    const result = await whatsappService.sendMessage(formattedPhone, message);

    res.json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
});

// Check WhatsApp API credits
router.get("/credits", auth, async (req, res) => {
  try {
    const credits = await whatsappService.checkCredits();
    res.json({
      success: true,
      data: credits,
    });
  } catch (error) {
    console.error("Credits check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking credits",
      error: error.message,
    });
  }
});

// Bulk inquiry for multiple products
router.post("/bulk-inquiry", auth, async (req, res) => {
  try {
    const { productIds, userPhone } = req.body;
    const userId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const formattedPhone = whatsappService.formatPhoneNumber(userPhone);
    const results = [];

    for (const productId of productIds) {
      try {
        const result = await whatsappService.handleProductInquiry(
          productId,
          userId,
          formattedPhone
        );
        results.push({ productId, ...result });
      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: "Bulk inquiry processed",
      results,
    });
  } catch (error) {
    console.error("Bulk inquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk inquiry",
      error: error.message,
    });
  }
});

module.exports = router;
