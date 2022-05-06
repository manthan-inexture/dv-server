const jwt = require('jsonwebtoken');
const User = require('../../schemas/User');
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.userLoginToken;
        const verifyToken = jwt.verify(token, "KALPKALPKALPKALPKALPKALPKALPKALP")

        const user = await User.findOne({ _id: verifyToken._id, "tokens.token": token });

        if (!user) {
            throw new Error('User not Found');
        }
        req.token = token;
        req.user = user;
        req.userID = user._id;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        console.log(err.message);
    }
}

module.exports = auth;