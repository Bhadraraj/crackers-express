const axios = require('axios');
const Product = require('../models/Product');
const dotenv = require('dotenv');

dotenv.config();

class WhatsAppService {
    constructor() {
        this.smsQuickerApiSecret = process.env.SMSQUICKER_API_SECRET;
        this.adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER; 
        this.smsQuickerBaseUrl = "https://smsquicker.com/api";
        this.fallbackEnabled = process.env.WHATSAPP_FALLBACK_ENABLED === 'true';

        if (!this.smsQuickerApiSecret) {
            console.warn("⚠️  SMSQUICKER_API_SECRET is not set in environment variables.");
        }
        if (!this.adminWhatsAppNumber) {
            console.warn("⚠️  ADMIN_WHATSAPP_NUMBER is not set in environment variables.");
        }
        
        console.log("WhatsApp Service initialized:");
        console.log("- API Secret:", this.smsQuickerApiSecret ? `Set (${this.smsQuickerApiSecret.substring(0, 10)}...)` : 'Not set');
        console.log("- Admin Number:", this.adminWhatsAppNumber || 'Not set');
        console.log("- Base URL:", this.smsQuickerBaseUrl);
    }

    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10 && !cleaned.startsWith('91')) {
            cleaned = `91${cleaned}`;
        }
        if (!cleaned.startsWith('+')) {
            return `+${cleaned}`;
        }
        return cleaned;
    }

    formatPhoneNumberWithoutPlus(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10 && !cleaned.startsWith('91')) {
            cleaned = `91${cleaned}`;
        }
        return cleaned;
    }

    /**
     * Test SMSQuicker credentials with their balance/status endpoint
     */
    async testCredentials() {
        console.log("\n🔍 Testing SMSQuicker credentials...");
        
        if (!this.smsQuickerApiSecret) {
            throw new Error("SMSQUICKER_API_SECRET is required");
        }

        // Test different credential parameter names
        const credentialTests = [
            { name: 'apikey', endpoint: '/balance.php', params: { apikey: this.smsQuickerApiSecret } },
            { name: 'secret', endpoint: '/v2/balance', params: { secret: this.smsQuickerApiSecret } },
            { name: 'api_key', endpoint: '/balance', params: { api_key: this.smsQuickerApiSecret } },
            { name: 'key', endpoint: '/status', params: { key: this.smsQuickerApiSecret } }
        ];

        for (const test of credentialTests) {
            try {
                console.log(`Testing ${test.name} format...`);
                const response = await axios.get(`${this.smsQuickerBaseUrl}${test.endpoint}`, {
                    params: test.params,
                    timeout: 10000,
                    validateStatus: () => true
                });

                console.log(`✅ ${test.name}: Status ${response.status}`);
                console.log(`Response:`, JSON.stringify(response.data, null, 2));

                // Check if this looks like a successful authentication
                if (response.status === 200 && response.data && 
                    response.data.status !== 401 && response.data.status !== 'error') {
                    console.log(`🎉 Found working credential format: ${test.name}`);
                    return { format: test.name, response: response.data };
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }

        throw new Error("Could not authenticate with any credential format");
    }

    /**
     * Test a simple message send to validate the working configuration
     */
    async testMessageSend(testNumber = null) {
        console.log("\n📱 Testing message send...");
        
        const testPhoneNumber = testNumber || this.adminWhatsAppNumber || '919999999999';
        const testMessage = "Test message from WhatsApp Service - " + new Date().toISOString();

        try {
            const result = await this.sendMessage(testPhoneNumber, testMessage);
            console.log("✅ Test message sent successfully!");
            return result;
        } catch (error) {
            console.log("❌ Test message failed:", error.message);
            throw error;
        }
    }

    /**
     * Comprehensive SMSQuicker API discovery and testing
     */
    async discoverWorkingAPI() {
        console.log("\n🔬 Discovering working SMSQuicker API configuration...");
        
        // Step 1: Test credentials first
        let credentialFormat;
        try {
            const credTest = await this.testCredentials();
            credentialFormat = credTest.format;
            console.log(`✅ Valid credentials found with format: ${credentialFormat}`);
        } catch (error) {
            console.log("❌ Credential test failed:", error.message);
            console.log("🔧 This suggests your API key might be invalid or expired.");
            console.log("💡 Please check:");
            console.log("   1. Your SMSQuicker account balance");
            console.log("   2. API key is correct and not expired");
            console.log("   3. Your account has WhatsApp API access enabled");
            return;
        }

        // Step 2: Test different send endpoints with the working credential format
        const sendConfigurations = [
            {
                name: "Standard Send",
                url: `${this.smsQuickerBaseUrl}/send.php`,
                params: (phone, message) => ({
                    [credentialFormat]: this.smsQuickerApiSecret,
                    numbers: phone,
                    message: message,
                    sender: this.adminWhatsAppNumber
                })
            },
            {
                name: "WhatsApp Send",
                url: `${this.smsQuickerBaseUrl}/sendWhatsApp.php`,
                params: (phone, message) => ({
                    [credentialFormat]: this.smsQuickerApiSecret,
                    mobile: phone,
                    msg: message,
                    device_id: this.adminWhatsAppNumber
                })
            },
            {
                name: "API v2",
                url: `${this.smsQuickerBaseUrl}/v2/send`,
                params: (phone, message) => ({
                    [credentialFormat]: this.smsQuickerApiSecret,
                    type: 'whatsapp',
                    number: phone,
                    message: message
                })
            }
        ];

        const testPhone = '919999999999'; // Safe test number
        const testMessage = 'API Discovery Test';

        for (const config of sendConfigurations) {
            try {
                console.log(`\nTesting: ${config.name}`);
                console.log(`URL: ${config.url}`);
                
                const params = config.params(testPhone, testMessage);
                console.log(`Params:`, JSON.stringify(params, null, 2));

                const response = await axios.post(config.url, new URLSearchParams(params), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 15000,
                    validateStatus: () => true
                });

                console.log(`Status: ${response.status}`);
                console.log(`Response:`, JSON.stringify(response.data, null, 2));

                if (this.isSuccessResponse(response)) {
                    console.log(`🎉 FOUND WORKING CONFIGURATION: ${config.name}`);
                    return {
                        workingConfig: config,
                        credentialFormat: credentialFormat,
                        testResponse: response.data
                    };
                }
            } catch (error) {
                console.log(`❌ ${config.name} failed:`, error.message);
            }
        }

        console.log("❌ No working send configuration found");
    }

    async sendMessage(toPhoneNumber, messageText, fileUrl = null) {
        if (!this.smsQuickerApiSecret) {
            throw new Error("SMSQUICKER_API_SECRET is not configured.");
        }
        if (!toPhoneNumber || !messageText) {
            throw new Error("Recipient phone number and message text are required.");
        }

        const formattedToPhoneNoPlus = this.formatPhoneNumberWithoutPlus(toPhoneNumber);

        // Enhanced configurations with more API key parameter variations
        const paramConfigurations = [
            {
                name: "Standard SMSQuicker (apikey)",
                url: `${this.smsQuickerBaseUrl}/send.php`,
                method: 'POST',
                params: {
                    apikey: this.smsQuickerApiSecret,
                    numbers: formattedToPhoneNoPlus,
                    message: messageText,
                    sender: this.adminWhatsAppNumber || 'WhatsApp'
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            },
            {
                name: "Standard SMSQuicker (api_key)",
                url: `${this.smsQuickerBaseUrl}/send.php`,
                method: 'POST',
                params: {
                    api_key: this.smsQuickerApiSecret,
                    numbers: formattedToPhoneNoPlus,
                    message: messageText,
                    sender: this.adminWhatsAppNumber || 'WhatsApp'
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            },
            {
                name: "WhatsApp Specific (apikey)",
                url: `${this.smsQuickerBaseUrl}/sendWhatsApp.php`,
                method: 'POST',
                params: {
                    apikey: this.smsQuickerApiSecret,
                    mobile: formattedToPhoneNoPlus,
                    msg: messageText,
                    device_id: this.adminWhatsAppNumber
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            },
            {
                name: "WhatsApp Specific (api_key)",
                url: `${this.smsQuickerBaseUrl}/sendWhatsApp.php`,
                method: 'POST',
                params: {
                    api_key: this.smsQuickerApiSecret,
                    mobile: formattedToPhoneNoPlus,
                    msg: messageText,
                    device_id: this.adminWhatsAppNumber
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            },
            {
                name: "API v2 Format (secret)",
                url: `${this.smsQuickerBaseUrl}/v2/send`,
                method: 'POST',
                params: {
                    secret: this.smsQuickerApiSecret,
                    type: 'whatsapp',
                    number: formattedToPhoneNoPlus,
                    message: messageText
                },
                headers: { 'Content-Type': 'application/json' }
            },
            {
                name: "API v2 Format (apikey)",
                url: `${this.smsQuickerBaseUrl}/v2/send`,
                method: 'POST',
                params: {
                    apikey: this.smsQuickerApiSecret,
                    type: 'whatsapp',
                    number: formattedToPhoneNoPlus,
                    message: messageText
                },
                headers: { 'Content-Type': 'application/json' }
            },
            {
                name: "Alternative Endpoint",
                url: `${this.smsQuickerBaseUrl}/send`,
                method: 'POST',
                params: {
                    apikey: this.smsQuickerApiSecret,
                    number: formattedToPhoneNoPlus,
                    message: messageText,
                    type: 'whatsapp'
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        ];

        let allErrors = [];

        for (const config of paramConfigurations) {
            try {
                console.log(`\n--- Trying: ${config.name} ---`);
                console.log(`URL: ${config.url}`);
                console.log(`Params:`, JSON.stringify(config.params, null, 2));

                const data = config.headers['Content-Type'] === 'application/x-www-form-urlencoded' 
                    ? new URLSearchParams(config.params).toString()
                    : config.params;

                const response = await axios.post(config.url, data, {
                    headers: config.headers,
                    timeout: 30000,
                    validateStatus: () => true
                });

                console.log(`Response Status: ${response.status}`);
                console.log(`Response Data:`, JSON.stringify(response.data, null, 2));

                // Check for success
                if (this.isSuccessResponse(response)) {
                    console.log(`✅ SUCCESS with ${config.name}`);
                    return {
                        success: true,
                        apiResponse: response.data,
                        configUsed: config.name
                    };
                } else {
                    allErrors.push({
                        config: config.name,
                        status: response.status,
                        data: response.data
                    });
                }

            } catch (error) {
                console.log(`❌ ${config.name} failed:`, error.message);
                allErrors.push({
                    config: config.name,
                    error: error.message,
                    data: error.response?.data
                });
            }
        }

        // Enhanced error analysis
        console.log("\n=== ALL ATTEMPTS FAILED ===");
        console.log("Errors:", JSON.stringify(allErrors, null, 2));

        // Provide specific troubleshooting advice
        const authErrors = allErrors.filter(e => e.status === 401 || (e.data && e.data.status === 401));
        if (authErrors.length > 0) {
            console.log("\n🔧 TROUBLESHOOTING SUGGESTIONS:");
            console.log("1. Check if your SMSQuicker API key is correct");
            console.log("2. Verify your SMSQuicker account balance");
            console.log("3. Ensure WhatsApp service is enabled in your account");
            console.log("4. Check if your API key has expired");
            console.log("5. Contact SMSQuicker support for API documentation");
        }

        throw new Error("Authentication failed - please verify your SMSQuicker API credentials and account status.");
    }

    isSuccessResponse(response) {
        if (response.status !== 200) return false;
        
        const data = response.data;
        if (!data) return false;

        // Check for explicit success indicators
        if (data.success === true || data.status === 'success' || data.status === 'sent') {
            return true;
        }

        // Check for message ID (indicates successful queuing)
        if (data.message_id || data.messageId || data.id) {
            return true;
        }

        // Check for positive status codes
        if (data.status === 200 || data.status === '200') {
            return true;
        }

        // Check for positive message content
        if (data.message && typeof data.message === 'string') {
            const successKeywords = ['sent', 'queued', 'delivered', 'accepted', 'success'];
            const lowerMessage = data.message.toLowerCase();
            if (successKeywords.some(keyword => lowerMessage.includes(keyword))) {
                return true;
            }
        }

        // Reject obvious failures
        if (data.status === 400 || data.status === 401 || data.status === 403) {
            return false;
        }

        if (data.message === false || data.data === false) {
            return false;
        }

        return false;
    }

    // Alternative method using WhatsApp Web URL as fallback
    async sendMessageWithFallback(toPhoneNumber, messageText, fileUrl = null) {
        console.log("\n=== ATTEMPTING TO SEND WHATSAPP MESSAGE ===");
        console.log("To:", toPhoneNumber);
        console.log("Message:", messageText.substring(0, 100) + "...");

        try {
            const result = await this.sendMessage(toPhoneNumber, messageText, fileUrl);
            console.log("✅ SMSQuicker successful");
            return result;
        } catch (error) {
            console.log("❌ SMSQuicker failed:", error.message);
            
            // Generate WhatsApp Web URL as fallback
            const phoneNumber = this.formatPhoneNumberWithoutPlus(toPhoneNumber);
            const encodedMessage = encodeURIComponent(messageText);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            console.log("🔄 Generated WhatsApp Web URL as fallback:");
            console.log(whatsappUrl);
            
            // Log the failed message for manual processing
            await this.logFailedMessage(toPhoneNumber, messageText, error.message, whatsappUrl);
            
            // You can either throw the error or return the fallback URL
            // For now, we'll throw to maintain the existing error handling
            throw error;
        }
    }

    async logFailedMessage(toPhoneNumber, messageText, errorReason, fallbackUrl = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            toPhoneNumber,
            messageText,
            errorReason,
            fallbackUrl,
            status: 'failed'
        };

        console.log("\n=== FAILED MESSAGE LOG ===");
        console.log(JSON.stringify(logEntry, null, 2));
        
        // TODO: Save this to a database or file for manual processing
        // await this.saveFailedMessageLog(logEntry);
    }

    // Rest of the methods remain the same...
    async handleProductInquiry(productId, userId, userPhone, userInfo = {}) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found.`);
        }

        const clientMessage = `Hi ${userInfo.name || 'there'},\n\nThank you for your interest in "${product.name}"!\nPrice: ₹${(product.discountedPrice || product.price).toFixed(2)}\n\nDescription: ${product.description || product.content || 'N/A'}\n\nWe'll get back to you shortly.\n\nBest regards,\nYour Store Team`;

        try {
            const clientResult = await this.sendMessageWithFallback(userPhone, clientMessage);
            
            if (clientResult.success && this.adminWhatsAppNumber) {
                const adminNotification = `New Product Inquiry:\nProduct: ${product.name}\nClient: ${userInfo.name || 'N/A'} (${userPhone})\nUser ID: ${userId || 'N/A'}`;
                
                try {
                    await this.sendMessageWithFallback(this.adminWhatsAppNumber, adminNotification);
                } catch (adminError) {
                    console.warn("Failed to send admin notification:", adminError.message);
                }
            }

            return { success: true, message: 'Product inquiry processed.', clientResponse: clientResult };
        } catch (error) {
            console.error("Failed to send product inquiry:", error.message);
            throw new Error(`Failed to send product inquiry: ${error.message}`);
        }
    }

    async sendCartSummaryToClient(clientPhoneNumber, cartItems) {
        if (!clientPhoneNumber || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Client phone number and cart items array are required.');
        }

        const productIds = cartItems.map(item => item.productId);
        const productsDB = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(productsDB.map(p => [p._id.toString(), p]));

        let message = `🛒 Your Order Summary 🛒\n\n`;
        let totalAmount = 0;

        cartItems.forEach((cartItem, index) => {
            const product = productMap.get(cartItem.productId);
            if (product) {
                const itemPrice = product.discountedPrice || product.price;
                const itemSubtotal = itemPrice * cartItem.quantity;
                totalAmount += itemSubtotal;

                message += `${index + 1}. ${product.name}\n`;
                message += `   Qty: ${cartItem.quantity}\n`;
                message += `   Price: ₹${itemPrice.toFixed(2)}\n`;
                message += `   Subtotal: ₹${itemSubtotal.toFixed(2)}\n\n`;
            }
        });

        message += `------------------------------------\n`;
        message += `💰 Total Amount: ₹${totalAmount.toFixed(2)}\n`;
        message += `------------------------------------\n\n`;
        message += `Thank you for your inquiry! We will contact you shortly.`;

        console.log("Cart Summary Message:\n", message);

        try {
            const clientResult = await this.sendMessageWithFallback(clientPhoneNumber, message);
            
            if (clientResult.success && this.adminWhatsAppNumber) {
                const adminNotification = `Cart Summary Sent:\nClient: ${clientPhoneNumber}\nItems: ${cartItems.length}\nTotal: ₹${totalAmount.toFixed(2)}`;
                
                try {
                    await this.sendMessageWithFallback(this.adminWhatsAppNumber, adminNotification);
                } catch (adminError) {
                    console.warn("Failed to send admin notification:", adminError.message);
                }
            }

            return { success: true, clientResponse: clientResult };
        } catch (error) {
            console.error("Failed to send cart summary:", error.message);
            throw new Error(`Failed to send cart summary: ${error.message}`);
        }
    }
}

module.exports = WhatsAppService;