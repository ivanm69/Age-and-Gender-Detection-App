const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Set up storage options for multer with file extension
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        // Use Date.now() to get a unique timestamp for the filename
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/detect-age-gender', upload.single('image'), async (req, res) => {
    try {
        const imageFilePath = req.file.path;
        const imageFileData = fs.readFileSync(imageFilePath);
        const base64Image = imageFileData.toString('base64');

        const response = await axios({
            method: 'post',
            url: 'https://age-detection-and-gender-detection-from-face-image.p.rapidapi.com/api/faces',
            headers: {
                'x-rapidapi-key': 'Import your API-KEY',
                'Content-Type': 'application/json'
            },
            data: {
                base64_image: base64Image
            }
        });

        // Process the API response and extract age and gender
        let ageGenderData = response.data;

        // Check if the data is in the expected format
        if (!ageGenderData.models || !Array.isArray(ageGenderData.models)) {
            throw new Error('Invalid data format for ageGenderData.models');
        }

        // The path for the uploaded image that will be used in the EJS template
        const uploadedImagePath = `/uploads/${req.file.filename}`;

        // Send the results back to the client along with the image path
        res.render('results', { ageGenderData, uploadedImagePath });

        // Optionally, delete the uploaded image file after processing
        // fs.unlinkSync(imageFilePath);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while detecting age and gender.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
