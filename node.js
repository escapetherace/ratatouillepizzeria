const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import the CORS middleware

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const port = 3000;

// Replace with your actual Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '7848481060:AAE39da0XcJ2N8CwuMKywPbHXS_965GvokQ';
let chatId = null;  // Store the dynamically fetched chat ID

// Enable CORS for all routes
app.use(cors());  // This allows CORS for all incoming requests

// Middleware to parse incoming JSON request body
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve static files from 'public' folder

// Webhook to capture chat ID from Telegram messages
app.post('/webhook', (req, res) => {
    const message = req.body.message;
    if (message && message.chat && message.chat.id) {
        chatId = message.chat.id;  // Capture chat ID
        console.log(`Chat ID captured: ${chatId}`);
    }
    res.sendStatus(200);  // Acknowledge Telegram webhook message
});

// Function to set Telegram webhook
const setTelegramWebhook = async (ngrokUrl) => {
    const webhookUrl = `${ngrokUrl}/webhook`;  // NGROK URL + /webhook endpoint
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;

    try {
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl }),
        });
        const data = await response.json();
        if (data.ok) {
            console.log(`Webhook set successfully: ${webhookUrl}`);
        } else {
            console.error('Failed to set webhook:', data);
        }
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
};

// Endpoint to receive order details and send to Telegram bot
app.post('/sendOrderToTelegram', async (req, res) => {
    const { message } = req.body;  // Extract the message (order details)

    console.log('Received order details:', message);  // Log the incoming message for debugging

    if (!chatId) {
        console.error('No chat ID available. Please send a message to the bot first.');
        return res.status(500).json({ success: false, message: 'No chat ID available. Send a message to the bot first.' });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,  // Use the captured chat ID
                text: message,    // Send the compiled order details
            }),
        });

        const data = await response.json();
        if (data.ok) {
            console.log('Order details sent to Telegram successfully');
            res.status(200).json({ success: true, message: 'Order sent to Telegram bot successfully' });
        } else {
            console.error('Error from Telegram API:', data);  // Log the error from Telegram API
            throw new Error('Failed to send order');
        }
    } catch (error) {
        console.error('Error sending order to Telegram:', error);  // Log the specific error
        res.status(500).json({ success: false, message: 'Failed to send order to Telegram bot', error: error.message });
    }
});

// Start the Express server and set the webhook when the server starts
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // Start NGROK and set the webhook
    const ngrokUrl = 'https://ca09-2601-2c6-4481-7f90-6cd5-6967-a911-1b09.ngrok-free.app';  // Replace with your NGROK URL
    setTelegramWebhook(ngrokUrl);  // Set Telegram webhook using NGROK URL
});
