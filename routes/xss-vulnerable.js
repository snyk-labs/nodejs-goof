const express = require('express');
const router = express.Router();

// UNSAFE: Direct XSS vulnerability - matches pattern Snyk detects
// This is a simple reflected XSS that Snyk should flag
router.get('/', (req, res) => {
    // Get user input directly from query parameter without sanitization
    // This is the source of the XSS vulnerability
    const userInput = req.query.input || 'No input provided';
    
    // UNSAFE: Directly embedding unsanitized user input in HTML response
    // This is the sink where the XSS occurs 
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>XSS Vulnerability Demo</title>
        </head>
        <body>
            <h1>XSS Vulnerability Demo</h1>
            <div>${userInput}</div>
        </body>
        </html>
    `);
});

module.exports = router;
