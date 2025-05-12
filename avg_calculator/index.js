const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('../avg_calculator/controller/calculate');  

dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 9876;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
app.use('/numbers', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the Average Calculator API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});