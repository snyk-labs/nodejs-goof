const express = require('express');
const router = express.Router();

const sanitizeInput = (value = '') =>
    String(value).replace(/[&<>"'`=/]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;',
        '=': '&#61;',
        '/': '&#47;'
    }[char] || char));



// SECURE: Safe endpoint with proper HTML escaping
router.get('/secure', (req, res) => {
    // Get user input from query parameter
    const userInput = req.query.input || 'No input provided';
    
    // SECURE: Properly escape user input before including in HTML
    const safeInput = escape(userInput);
    
    // SECURE: Use Content Security Policy header to mitigate XSS impact
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");
    
    // SECURE: Set X-XSS-Protection header (for older browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // SECURE: Set X-Content-Type-Options to prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Secure XSS Demo</title>
            <style>
                .user-input {
                    background-color: #f0f0f0;
                    padding: 10px;
                    border: 1px solid #ddd;
                    margin: 10px 0;
                    word-wrap: break-word;
                }
                .safe {
                    color: green;
                }
            </style>
        </head>
        <body>
            <h1>Secure XSS Demo</h1>
            <p>Your input (safely escaped):</p>
            <div class="user-input safe">${safeInput}</div>
            <p>Try entering script tags or other HTML - they'll be escaped!</p>
            <form action="/xss-vuln/secure" method="get">
                <input type="text" name="input" placeholder="Enter some text" value="${safeInput}">
                <button type="submit">Submit</button>
            </form>
            <p><a href="/xss-vuln">Back to vulnerable example</a></p>
        </body>
        </html>
    `);
});

// SECURE: JSON endpoint for automated testing with sanitized echo
router.get('/secure/json', (req, res) => {
    const rawInput = req.query.input;
    const userInput = typeof rawInput === 'string' ? rawInput : 'No input provided';
    const safeInput = sanitizeInput(userInput);

    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.json({
        message: 'Secure JSON echo',
        echo: safeInput,
        rawLength: userInput.length
    });
});

module.exports = router;
