const xrpl = require('xrpl');
require('dotenv').config();

/**
 * 今日PQRトークンを配布した相手のアドレスを取得する
 * @returns pqrTransactions PQRを配布した相手のアドレスリスト
 */
async function getSendPqrAddress() {
    const client = new xrpl.Client(process.env.TEST_NET);

    await client.connect();

    const response = await client.request({
        command: 'account_tx',
        account: process.env.SYS_WALLET_ADDRESS,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        forward: false
    });


    const transactions = response.result.transactions;
    const pqrTransactions = [];
    const today = new Date().toISOString().slice(0,10);
    for (const tx of transactions) {
        const txDate =  new Date((tx.tx_json.date + 946684800) * 1000).toISOString().slice(0, 10);
        if (tx.tx_json && txDate === today && tx.tx_json.TransactionType === 'Payment') {
            if(tx.meta && tx.meta.delivered_amount && tx.meta.delivered_amount.currency === 'PQR') {
                pqrTransactions.push(tx.tx_json.Destination);
            }
            
        }
    }
    console.log(pqrTransactions);
    client.disconnect();
    return pqrTransactions;
}

/**
 * PQRのClawback（回収）を行う
 * @param {string} userWalletAddress Clawback相手のアドレス
 */
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



// (async () => {
//     const users = await getSendPqrAddress();
//     for(const user of users) {
//         await clawbackPqr(user);
//     }
// })();

async function index() {
    const users = await getSendPqrAddress();
    for (const user of users) {
        await clawbackPqr(user);
    }
}

module.exports.handler = index