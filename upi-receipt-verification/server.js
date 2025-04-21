const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('receipt'), async (req, res) => {
  const filePath = req.file.path;
  try {
    const isReal = await verifyReceipt(filePath);
    res.send(isReal ? 'Receipt is real.' : 'Receipt is fake.');
  } catch (error) {
    res.status(500).send('Error verifying receipt.');
  }
});

const verifyReceipt = (filePath) => {
  // Placeholder verification logic
  return new Promise((resolve) => {
    setTimeout(() => {
      const isReal = Math.random() > 0.5;
      resolve(isReal);
    }, 2000);
  });
};

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});