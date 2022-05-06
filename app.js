const express = require('express');
const cookieParser = require('cookie-parser');
const cors  = require("cors")
const app = express();
app.use(cookieParser());
app.use(cors())
require('./db/conn');
app.use(express.json());
app.use(require('./router/customer'));
app.use(require('./router/user'));
app.get('/', (req, res) => {
    res.send('Hello Digital Validator');
});
app.listen(process.env.port || 5000, () => console.log("i am running on port 5000"));
