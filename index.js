const express = require('express')
const fs = require('fs')
const https = require('https')
const path = require('path');
const app = express()
const multer  = require('multer')
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet')
const bodyParser = require('body-parser')
const { home } = require('./home');
const auth = require('basic-auth'); 

const maxSize = 4 * 1000 * 1000;

const upload = multer({
  limits:{
	fileSize:maxSize
	},
  fileFilter: function (req, file, cb) {
    var filetypes = /jpeg|jpg|png/
    var mimetype = filetypes.test(file.mimetype)
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname && file.originalname === escape(file.originalname)) {
      return cb(null, true)
    }
    cb("Error: File upload not valid")
  },
  dest: './uploads'
})

app.use(upload.single('avatar'))
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ['*'],
      upgradeInsecureRequests: true,
    },
  })
);
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
);
app.use('/uploads', express.static(path.join(__dirname, './uploads')))
app.use(helmet.ieNoOpen());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(csrf({ cookie: true }))

app.get('/', function(req, res) {
  res.send(
    home({
      csrfToken: req.csrfToken()
    })
  )
})

app.post('/upload', upload.single('avatar'), function (req, res, next) {
  fs.chmodSync(`./uploads/${req.file.filename}`, '666')
  res.redirect(`/display?image=${req.file.filename}`)
})

app.get('/display', function(req, res, next) {
  if (!auth(req)) {
    res.set('WWW-Authenticate', 'Basic realm="image access"')
    return res.status(401).send()
  }
  let { name, pass } = auth(req)
  name = escape(name)
  pass = escape(pass)
  if (name === process.env.USER && pass === process.env.PASSWORD) {
    const pathImage = `${__dirname}/uploads/${req.query.image}`
    fs.readFile(pathImage, function (err, data) {
      if (err) throw err
      res.header('Content-Type', 'image/jpg')
      res.send(data)
    })
  } else {
    return res.status(401).send('bad creds')
  }
})

https.createServer(
  {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
  },
  app
).listen(process.env.PORT, function (){
	console.log('okkkkk you re connect')
});