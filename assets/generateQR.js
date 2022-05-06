const QRcode = require('qrcode');
const generateQR = async (text) =>  {
    try {
        const dataURL = await QRcode.toDataURL(text);
        if (dataURL) {
            return dataURL;
        }
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = generateQR;