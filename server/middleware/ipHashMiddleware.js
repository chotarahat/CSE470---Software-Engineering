const crypto = require('crypto');

const hashIP = (req,res,next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const hashedIP = crypto.createHash('shah256').update(ip).digest('hex');
    req.hashedIP=hashedIP;
    next();
};
module.exports=hashIP;