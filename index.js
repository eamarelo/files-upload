var express = require('express')
var fs = require('fs')
var https = require('https')
var path = require('path');
var app = express()
var multer  = require('multer')
var maxSize = 4 * 1000 * 1000;

const upload = multer({
  fileFilter: function (req, file, cb) {
    var filetypes = /jpeg|jpg|png/
    var mimetype = filetypes.test(file.mimetype)
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname && file.originalname === escape(file.originalname)) {
      return cb(null, true)
    }
    cb("Error: File upload not valid")
  },
  dest: 'uploads/'
})

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/profile', upload.single('avatar'), function (req, res, next) {
	console.log('req.file', req.file)

})

https.createServer({
  key: fs.readFileSync('files-upload.com+5-key.pem'),
  cert: fs.readFileSync('files-upload.com+5.pem')
}, app)
.listen(3000, function () {
  console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})
	