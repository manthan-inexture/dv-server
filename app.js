const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
require('./db/conn');
app.use(express.json());
app.use(require('./router/customer'));
app.use(require('./router/user'));
app.get('/', (req, res) => {
    res.send('Hello Digital Validator');
});
app.listen(5000, () => console.log("i am running on port 5000"));
