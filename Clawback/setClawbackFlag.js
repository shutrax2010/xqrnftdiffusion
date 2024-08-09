const xrpl = require('xrpl');
require('dotenv').config();

async function setClawbackFlag() {
    const client = new xrpl.Client(process.env.TEST_NET);
    const wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
    await client.connect();

    try{
        const response = await client.submitAndWait({
            TransactionType: "AccountSet",
            Account: wallet.address,
            SetFlag: xrpl.AccountSetAsfFlags.asfAllowTrustLineClawback,
        }, {wallet: wallet });

        console.log(JSON.stringify(response.result, null, 2));
    }catch (error) {
        console.error('Error:', error);
    }
    client.disconnect();
}

setClawbackFlag();