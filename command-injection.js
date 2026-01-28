const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// Vulnerable to Command Injection
// Example: /ci?host=8.8.8.8; ls
router.get('/ci', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error: ${error.message}`);
    }
    res.send(`<pre>${stdout}</pre>`);
  });
});

module.exports = router;