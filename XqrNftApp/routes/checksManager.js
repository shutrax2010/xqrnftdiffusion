const { XummSdk } = require('xumm-sdk');
const xrpl = require('xrpl');
const { log, error } = require('./logger');

const xummApiKey = process.env.XUMM_APIKEY;
const xummSecret = process.env.XUMM_APISECRET;
const xumm = new XummSdk(xummApiKey, xummSecret);
const net = process.env.TEST_NET;

//client create check ,so need to login using xumm
async function createCheck(destinationAddress, amount, currency, issuerAddress) {
    // Prepare the CheckCreate transaction
    const tx = {
        TransactionType: 'CheckCreate',
        Destination: destinationAddress,
        SendMax: {
            "currency": currency,
            "value": amount,
            "issuer": issuerAddress
        },
        Expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        Fee: '12'
    };

    // Create a payload for Xumm
    const payload = {
        txjson: tx,
        tx_type: 'CheckCreate'
    };

    // Create a new transaction using Xumm
    try {
        const response = await xumm.payload.createAndSubscribe(payload);

        log("create check : ", response);

        const uuid = response.created.uuid; // UUID from response
        const signInUrl = response.created.next.always; // Sign-in URL
        // Return both UUID and sign-in URL
        return {
            uuid: uuid,
            url: signInUrl
        };
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
}

//server accept payment 
async function cashCheck(txid, recipientSecret) {
    console.log("checkID : ", txid)
    const client = new xrpl.Client(net);
    await client.connect();

    const recipientWallet = xrpl.Wallet.fromSecret(recipientSecret);
    const recipientWalletAddress = recipientWallet.classicAddress

    const response = await client.request({
        command: 'tx',
        transaction: txid
    });
    console.log("txid res: ", response);


    // Prepare the Check Cash transaction
    const tx = {
        TransactionType: 'CheckCash',
        CheckID: checkID,
        Amount: {
            "currency": 'PQR',
            "value": '2',
            "issuer": recipientWalletAddress
        },
        Account: recipientWalletAddress,
    };

    // Autofill, sign, and submit the transaction
    const preparedTx = await client.autofill(tx);
    const result = await client.submitAndWait(preparedTx, { wallet: recipientWallet })

    console.log('Check cashed:', result);
    await client.disconnect();
}

async function cancelCheck(checkID, senderAddress) {
    const client = net;
    await client.connect();

    // Prepare the Check Cancel transaction
    const tx = {
        TransactionType: 'CheckCancel',
        CheckID: checkID,
        Fee: '12',
        Account: senderAddress,
        Sequence: await client.getAccountInfo(senderAddress).then(info => info.account_data.Sequence),
        LastLedgerSequence: (await client.getLedger()).ledger_index + 10
    };

    // Autofill, sign, and submit the transaction
    const preparedTx = await client.autofill(tx);
    const { signedTransaction } = client.sign(preparedTx, senderSecret);
    const result = await client.submit(signedTransaction);

    console.log('Check canceled:', result);
    await client.disconnect();
}

module.exports = {
    createCheck,
    cashCheck,
    cancelCheck
};