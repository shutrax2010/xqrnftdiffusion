const xrpl = require('xrpl');
require('dotenv').config();

async function checkAccountInfo() {
    const client = new xrpl.Client(process.env.TEST_NET);

    await client.connect();

    try{
        const response = await client.request({
            command: 'account_info',
            account: process.env.SYS_WALLET_ADDRESS,
        });

        console.log('Account Info:', response);
    }catch (error) {
        console.error('Error:', error);
    }
    client.disconnect();
}

checkAccountInfo();