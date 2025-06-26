const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

// Configure axios instance for M-Pesa API
const mpesaAxios = axios.create({
  baseURL: 'https://sandbox.safaricom.co.ke',
  timeout: 10000 // 10 seconds timeout
});

// Cache access token to avoid unnecessary requests
let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && moment().isBefore(tokenExpiry)) {
    return cachedToken;
  }

  try {
    const url = "/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const response = await mpesaAxios.get(url, {
      headers: { 
        Authorization: `Basic ${auth}` 
      }
    });

    // Cache token (expires in 3599 seconds, we'll use 3500 for safety)
    cachedToken = response.data.access_token;
    tokenExpiry = moment().add(3500, 'seconds');
    
    return cachedToken;

  } catch (error) {
    console.error('M-Pesa Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
}

async function stkPush({ phone, amount, accountReference, transactionDesc }) {
  // Validate required parameters
  if (!phone || !amount || !accountReference || !transactionDesc) {
    throw new Error('Missing required parameters');
  }

  // Format phone number (ensure starts with 254)
  const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`;

  try {
    const token = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(Number(amount)),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference.substring(0, 12), // Max 12 chars
      TransactionDesc: transactionDesc.substring(0, 13) // Max 13 chars
    };

    const response = await mpesaAxios.post(
      "/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      success: true,
      CheckoutRequestID: response.data.CheckoutRequestID,
      MerchantRequestID: response.data.MerchantRequestID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription
    };

  } catch (error) {
    console.error('STK Push Error:', {
      request: error.config?.data,
      response: error.response?.data || error.message
    });

    return {
      success: false,
      errorCode: error.response?.data?.errorCode || 'API_ERROR',
      errorMessage: error.response?.data?.errorMessage || error.message
    };
  }
}

module.exports = { stkPush };