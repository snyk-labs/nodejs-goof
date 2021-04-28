const express = require('express')
const multer  = require('multer')
const path = require('path')
const fs = require("fs");
const child_process = require("child_process");

const PORT = 3112;
const FILE_OUTPUT = "/tmp/resized_picture.jpg";

const upload = multer({ dest: 'uploads/' })
const app = express()

app.post('/upload', upload.single('twitter_picture'), function (req, res, next) {

    child_process.execFile(
      "/usr/bin/convert",
      [path.join(__dirname, req.file.path), "-resize", "280x150", FILE_OUTPUT],
      function() {
        console.log('done resizing')
        return res.redirect('/public/result.html');
      }
    );
});

app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(PORT, function () { console.log('Example app listening on port: ', PORT) })