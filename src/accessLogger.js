function isEmptyObject(obj) {
    const isEmpty = Object.keys(obj).length === 0;
    return isEmpty;
}

function accessLogger(req, res, next) {
    const date = new Date().toDateString();
    const path = req.path;
    console.log(`${date} ${req.ip} ${req.method} ${path}`);
    next();
}

module.exports = accessLogger;