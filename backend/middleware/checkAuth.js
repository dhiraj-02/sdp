const jwt = require('jsonwebtoken');
const secret = 'SECRET';
module.exports = (req, res, next) => {
    try {
        let token = req.headers['authorization'].split(' ')[1];
        const decoded = jwt.verify(token, secret);
        req.userData = decoded;
        //console.log(req.userData);
        next();
    } catch (er) {
        return res.status(401).json({ "message": "Not authorized" });
    }
}