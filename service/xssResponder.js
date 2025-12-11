function processUserInput(userInput, res) {
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>XSS Vulnerability Demo</title>
        </head>
        <body>
            <h1>XSS Vulnerability Demo</h1>
            <div>${userInput}</div>
            <p><a href="/xss-vuln/secure?input=Try%20this%20secure%20endpoint">Try the secure endpoint</a></p>
        </body>
        </html>
    `;

  res.send(html);
}

module.exports = {
  processUserInput
};
