const xrpl = require('xrpl');
require('dotenv').config();

async function clawbackPqr(userWalletAddress) {
    const client = new xrpl.Client(process.env.TEST_NET);
    const systemWallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);

    await client.connect();

    try{
        const response = await client.submitAndWait({
            TransactionType: "Clawback",
            Account: systemWallet.address,
            Amount: {
                issuer: userWalletAddress,
                currency: 'PQR',
                value: '10'
            }
        }, {wallet: systemWallet });

        console.log(JSON.stringify(response.result, null, 2));
    }catch (error) {
        console.error('Error:', error);
    }
    client.disconnect();
}


const oonakaTestAddres = 'rBfDryDnNvZU7TomA8bL42dnzcQjhezYjt';
clawbackPqr(oonakaTestAddres);