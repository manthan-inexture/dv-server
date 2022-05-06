function checkId(id) {
    if (id.length !== 24) {
        return false;
    }
    for (const char of id) {
        if ((char < '0' || char > '9') && (char < 'a' || char > 'f')) {
            return false;
        }
    }
    return true;
}

module.exports = checkId;