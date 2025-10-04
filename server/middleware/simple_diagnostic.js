const axios = require('axios');
const dotenv = require('dotenv');
const { URLSearchParams } = require('url'); // Import URLSearchParams

// Load environment variables from .env file
dotenv.config({ path: '../.env' }); // Adjust path as needed, assuming .env is in project root

async function simpleDiagnostic() {
    console.log("🔍 Simple WhatsApp Service Diagnostic\n");
    
    // Check environment variables
    console.log("=== Environment Check ===");
    const apiSecret = process.env.SMSQUICKER_API_SECRET;
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
    
    console.log("API Secret:", apiSecret ? `Set (${apiSecret.substring(0, 4)}...${apiSecret.slice(-4)})` : '❌ Not set'); // Mask API key
    console.log("Admin Number:", adminNumber || '❌ Not set');
    
    if (!apiSecret) {
        console.log("\n❌ SMSQUICKER_API_SECRET is required!");
        console.log("Add it to your .env file in the project root: SMSQUICKER_API_SECRET=your_api_key");
        return;
    }
    
    // Test different API endpoints and credential formats for balance/status
    const baseUrl = "https://smsquicker.com/api";
    const testConfigs = [
        {
            name: "Balance Check (secret param)",
            url: `${baseUrl}/get/credits`, // Based on your whatsappService.js
            params: { secret: apiSecret },
            method: 'GET'
        },
        {
            name: "Balance Check (apikey param, balance.php)",
            url: `${baseUrl}/balance.php`,
            params: { apikey: apiSecret },
            method: 'GET'
        },
        {
            name: "Balance Check (api_key param, balance.php)",
            url: `${baseUrl}/balance.php`,
            params: { api_key: apiSecret },
            method: 'GET'
        },
        // Add more common endpoints/params if known or found in their docs
    ];
    
    console.log("\n=== Testing API Endpoints (GET) ===");
    
    let workingConfig = null;
    
    for (const config of testConfigs) {
        try {
            console.log(`\nTesting: ${config.name}`);
            console.log(`URL: ${config.url}`);
            
            const response = await axios.get(config.url, {
                params: config.params,
                timeout: 10000,
                validateStatus: () => true // Accept all status codes to see raw response
            });
            
            console.log(`Status: ${response.status}`);
            console.log(`Response:`, JSON.stringify(response.data, null, 2));
            
            if (response.status === 200 && response.data && 
                (response.data.status === 'success' || response.data.credits !== undefined)) { // Look for success or credits directly
                console.log(`✅ ${config.name} - SUCCESS! This config might be correct.`);
                workingConfig = config;
                // Don't break here, let's see if other balance checks also work
            } else {
                console.log(`❌ ${config.name} - Failed or unexpected response.`);
            }
            
        } catch (error) {
            console.log(`❌ ${config.name} - Error: ${error.message}`);
        }
    }
    
    if (!workingConfig) {
        console.log("\n❌ No successful balance/status configuration found with provided API secret!");
        console.log("Please double-check your SMSQUICKER_API_SECRET in the .env file.");
        console.log("Or contact SMSQuicker support for the correct balance/status endpoint and parameter name.");
        return; // Exit if we can't even verify the API key
    } else {
         console.log("\n✅ At least one balance/status endpoint worked. Proceeding to message sending tests.");
    }

    // --- Message Sending Tests ---
    if (!adminNumber) {
        console.log("\n⚠️ ADMIN_WHATSAPP_NUMBER is not set. Skipping message sending tests.");
        return;
    }

    console.log("\n=== Testing Message Send (POST) ===");
    
    // We're going to try various permutations of the 'from' parameter and phone number formats
    const adminPhonesToTest = [
        adminNumber, // As is from .env
        adminNumber.startsWith('+') ? adminNumber.replace('+', '') : `+${adminNumber}`, // Toggle '+'
        adminNumber.replace(/\D/g, '') // Digits only
    ];

    const recipientPhone = "8489964308"; // Using a hardcoded test recipient for diagnostics
    const formattedRecipientToTest = [
        `+${recipientPhone}`, // E.164
        recipientPhone,        // Digits only
        `91${recipientPhone.slice(-10)}` // India specific if needed
    ];

    // Common sender parameter names to try
    const senderParamNames = ['from', 'sender', 'device_id', 'instance_id', 'source_number', 'channel'];

    // Possible WhatsApp message endpoints
    const whatsappSendEndpoints = [
        `${baseUrl}/send/whatsapp`, // Your current one
        `${baseUrl}/sendWhatsApp.php`, // Common older PHP-based endpoint
        `${baseUrl}/whatsapp/send`,
        `${baseUrl}/api/whatsapp/send` // If their base URL is different
    ];

    let messageSentSuccessfully = false;

    for (const endpoint of whatsappSendEndpoints) {
        for (const senderParamName of senderParamNames) {
            for (const adminNum of adminPhonesToTest) {
                for (const recipientNum of formattedRecipientToTest) {
                    const params = {
                        secret: apiSecret, // Keep secret parameter as is
                        message: `Diagnostic test from ${senderParamName} with ${adminNum} to ${recipientNum} at ${new Date().toLocaleTimeString()}`,
                        // Dynamically set the sender parameter
                        [senderParamName]: adminNum, 
                        // Recipient number
                        number: recipientNum,
                        type: 'whatsapp' // Keep this for now, it's a common requirement
                    };

                    try {
                        console.log(`\nAttempting to send via POST to ${endpoint}`);
                        console.log(`  Sender Param Name: '${senderParamName}', Sender Value: '${adminNum}'`);
                        console.log(`  Recipient Number: '${recipientNum}'`);
                        console.log(`  Full Params: ${JSON.stringify(params)}`);

                        const response = await axios.post(endpoint, new URLSearchParams(params), {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            timeout: 15000,
                            validateStatus: () => true
                        });
                        
                        console.log(`  Status: ${response.status}`);
                        console.log(`  Response:`, JSON.stringify(response.data, null, 2));

                        if (response.status === 200 && response.data && 
                            (response.data.status === 'success' || response.data.sent === true || response.data.message_id || response.data.messageId)) {
                            console.log(`✅ SUCCESS! Message likely sent.`);
                            console.log(`   Working Endpoint: ${endpoint}`);
                            console.log(`   Working Sender Param: '${senderParamName}'`);
                            console.log(`   Working Admin Number Format: '${adminNum}'`);
                            console.log(`   Working Recipient Number Format: '${recipientNum}'`);
                            messageSentSuccessfully = true;
                            // You can break here if you want to stop after the first success
                            // return; 
                        } else if (response.data && response.data.message === 'Invalid Parameters!') {
                            console.log(`  ➡️ Response: Invalid Parameters! - Likely incorrect param names or formats.`);
                        } else if (response.data && (response.data.status === 401 || response.data.status === 'error' || response.data.message === 'Unauthorized')) {
                            console.log(`  ➡️ Response: Authentication Error - Check API Secret and account status.`);
                        } else {
                            console.log(`  ➡️ Response: Other API Error or unexpected response.`);
                        }

                    } catch (error) {
                        console.log(`❌ Failed to send: ${error.message}`);
                    }
                }
            }
        }
    }

    if (!messageSentSuccessfully) {
        console.log("\n❌ No message sending attempt was successful. Review all parameters and try contacting SMSQuicker support.");
    }

    console.log("\n=== Diagnostic Complete ===");
}

// Main execution block
if (require.main === module) {
    simpleDiagnostic().catch(console.error);
}