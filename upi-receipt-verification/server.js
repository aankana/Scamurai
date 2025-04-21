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

const sharp = require('sharp');

const preprocessImage = async (filePath) => {
  const outputFilePath = 'uploads/preprocessed-' + Date.now() + '.png';
  await sharp(filePath)
    .resize(800) // Resize to improve OCR
    .grayscale() // Convert to grayscale
    .toFile(outputFilePath);
  return outputFilePath;
};

// Modify the upload route to preprocess the image
app.post('/upload', upload.single('receipt'), async (req, res) => {
  const filePath = req.file.path;
  try {
    const preprocessedPath = await preprocessImage(filePath);
    const isReal = await verifyReceipt(preprocessedPath);
    res.send(isReal ? 'Receipt is real.' : 'Receipt is fake.');
  } catch (error) {
    res.status(500).send('Error verifying receipt.');
  }
});

const Tesseract = require('tesseract.js');

const verifyReceipt = (filePath) => {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      filePath,
      'eng',
      {
        logger: info => console.log(info) // Optional: log progress
      }
    ).then(({ data: { text } }) => {
      console.log(text); // Log the extracted text
      // Implement your logic to check if the text matches expected patterns
      const isReal = text.includes('Expected Text'); // Example check
      resolve(isReal);
    }).catch(err => reject(err));
  });
};

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID',
  key_secret: 'YOUR_RAZORPAY_KEY_SECRET',
});

const verifyTransaction = async (transactionId) => {
  try {
    const payment = await razorpay.payments.fetch(transactionId);
    if (payment.status === 'captured') {
      return { valid: true, details: payment };
    } else {
      return { valid: false, details: payment };
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return { valid: false, error: error.message };
  }
};

// Example usage
const transactionId = 'UPI1234567890';
verifyTransaction(transactionId).then((result) => {
  console.log(result);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});