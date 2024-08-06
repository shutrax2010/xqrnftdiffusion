const { XummSdk } = require('xumm-sdk');

const xummApiKey = process.env.XUMM_APIKEY;
const xummSecret = process.env.XUMM_APISECRET;
const xumm = new XummSdk(xummApiKey, xummSecret);

async function createCheck(destinationAddress, amount, currency, issuerAddress) {
    // Prepare the CheckCreate transaction
    const tx = {
        TransactionType: 'CheckCreate',
        Destination: destinationAddress,
        Amount: {
            value: amount,
            currency: currency,
            issuer: issuerAddress
        },
        Expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        Fee: '12'
    };

    // Create a payload for Xumm
    const payload = {
        txjson: tx,
        tx_type: 'Payment'
    };

    // Create a new transaction using Xumm
    try {
        const response = await xumm.payload.create(payload);

        // Redirect user to Xumm for signing
        console.log('Please sign this transaction using Xumm:', response);
        window.location.href = response.next.always;
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
}

async function cashCheck(checkID, recipientSecret) {
    const client = new xrpl.Client('wss://s1.ripple.com');
    await client.connect();

    const recipientWallet = xrpl.Wallet.fromSecret(recipientSecret);

    // Prepare the Check Cash transaction
    const tx = {
        TransactionType: 'CheckCash',
        CheckID: checkID,
        Amount: '1000000', // Amount in drops
        Fee: '12',
        Account: recipientWallet.classicAddress,
        Sequence: await client.getAccountInfo(recipientWallet.classicAddress).then(info => info.account_data.Sequence),
        LastLedgerSequence: (await client.getLedger()).ledger_index + 10
    };

    // Autofill, sign, and submit the transaction
    const preparedTx = await client.autofill(tx);
    const { signedTransaction } = client.sign(preparedTx, recipientSecret);
    const result = await client.submit(signedTransaction);

    console.log('Check cashed:', result);
    await client.disconnect();
}

async function cancelCheck(checkID, senderAddress) {
    const client = new xrpl.Client('wss://s1.ripple.com');
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