const express = require('express');
const cors = require('cors');
const uploadRouter = require('./upload'); // add this

const app = express();
app.use(cors());
app.use('/upload', uploadRouter); // add this line

app.listen(3000, () => console.log('Node server running on http://192.168.20.69:3000'));
