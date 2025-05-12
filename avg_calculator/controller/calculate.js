const express = require('express');
const axios = require('axios');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

// Constants
const WINDOW_SIZE = 10;
const BASE_URL = process.env.BASE;
const TIMEOUT_MS = 500;
const AUTH_TOKEN = process.env.AUTH;


// Store window state
let numberWindow = [];

const getEndpoint = (type) => {
    const endpoints = {
         'p':`${BASE_URL}/primes`,     //for Prime numbers
        'f': `${BASE_URL}/fibo`,       //for Fibonacci numbers
        'e': `${BASE_URL}/even`,       //for Even numbers
        'r': `${BASE_URL}/rand`        //for Random numbers
    };
    return endpoints[type];
};

const updateNumberWindow = (newNumbers) => {
    // Add only unique numbers and maintain window size
    for (const num of newNumbers) {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= WINDOW_SIZE) {
                numberWindow.shift(); // Remove oldest number
            }
            numberWindow.push(num);
        }
    }
};

const calculateAverage = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    return sum / numbers.length;
};

const getNumbers = async (req, res) => {
    try {
        const { numberid } = req.params;
        // Store current state before updating
        const windowPrevState = [...numberWindow];
        
        // Validate and get endpoint
        const endpoint = getEndpoint(numberid.toLowerCase());
        if (!endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Invalid number type. Use p(prime), f(fibonacci), e(even), or r(random)'
            });
        }

        // Make API request
        const response = await axios.get(endpoint, { 
            timeout: TIMEOUT_MS,
            validateStatus: (status) => status === 200,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        // Validate response
        if (!response.data || !Array.isArray(response.data.numbers)) {
            throw new Error('Invalid response format from external API');
        }

        // Process numbers
        const newNumbers = response.data.numbers;
        updateNumberWindow(newNumbers);
        const avg = calculateAverage(numberWindow);

        // Return response
        return res.status(200).json({
            windowPrevState,
            windowCurrState: [...numberWindow],
            numbers: newNumbers,
            avg: parseFloat(avg.toFixed(2))
        });

    } catch (error) {
        console.error('Error:', error.message);
        
        // Handle specific errors
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                error: 'Request timeout - External service took too long to respond'
            });
        }

        if (error.response?.status === 401) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid or expired token'
            });
        }

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: `External API error: ${error.response.statusText}`
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};

// Route handler
router.get('/:numberid', getNumbers);

module.exports = router;

