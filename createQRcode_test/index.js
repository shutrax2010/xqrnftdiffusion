require('dotenv').config();
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

const fs = require('fs');
const readableStreamForFile = fs.createReadStream('./test_createQRcode.png');
const options = {
    pinataMetadata: {
        name: 'test_createQRcode.png',
        keyvalues: {
            customKey: 'customValue',
            customKey2: 'customValue2'
        }
    }
};

pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
    //handle results here
    console.log(result);
}).catch((err) => {
    //handle error here
    console.log(err);
});
