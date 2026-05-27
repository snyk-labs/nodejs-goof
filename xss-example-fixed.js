const express = require('express');
const app = express();

// Helper function to escape HTML special characters
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Secure route with escaped user input
app.get('/xss', (req, res) => {
    const name = req.query.name || 'World';
    const safeName = escapeHtml(name);
    res.send(`<h1>Hello, ${safeName}!</h1>`);
});

app.listen(3002, () => {
    console.log('Fixed XSS example app listening on port 3002');
}); 