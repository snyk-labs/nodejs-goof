const express = require('express');
const app = express();

// Example route with XSS vulnerability
app.get('/xss', (req, res) => {
    const name = req.query.name || 'World';
    // Vulnerable: unsanitized user input is rendered directly in HTML
    res.send(`<h1>Hello, ${name}!</h1>`);
});

app.listen(3001, () => {
    console.log('XSS example app listening on port 3001');
}); 