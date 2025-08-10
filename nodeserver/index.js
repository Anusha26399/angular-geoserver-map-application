const express = require('express');
const cors = require('cors');
const uploadRouter = require('./upload'); // add this

const app = express();
app.use(cors());
app.use('/upload', uploadRouter); // add this line

