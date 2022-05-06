const jwt = require('jsonwebtoken');
const Customer = require('../../schemas/Customer');
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.cusLoginToken;
        const verifyToken = jwt.verify(token,"KALPKALPKALPKALPKALPKALPKALPKALP")
        const rootUser = await Customer.findOne({_id:verifyToken._id, "tokens.token": token});

        if (!rootUser) {
            throw new Error('User not Found');
        }
        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;
        next();
    } catch (err) {
        res.status(401).json({error: 'Unauthorized: No token provided'});
        console.log(err.message);
    }
}

module.exports = auth;