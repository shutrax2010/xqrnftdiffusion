var express = require('express');
var router = express.Router();
const xrpl = require('xrpl');
const { XummSdk } = require('xumm-sdk');

const xummApiKey = process.env.XUMM_APIKEY;
const xummSecret = process.env.XUMM_APISECRET;
const xumm = new XummSdk(xummApiKey,xummSecret);

const { isAuthenticated } = require('../authMiddleware');

const sys_walletAddress = process.env.SYS_WALLET_ADDRESS;
let user_walletAddress = '';

/** 初期表示 */
router.get('/', isAuthenticated, function(req, res, next) {
    if (req.session.authenticated) {
        user_walletAddress = req.session.account;
        res.render('token',{
            walletAddress: user_walletAddress
        });
    }
});

/** Trustlineを設定する */
router.post('/setTrustline', async function(req, res, next) {
    const net = process.env.TEST_NET;
    const client = new xrpl.Client(net);
    

    const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
    
    await checkAccountCurrencies(client, user_walletAddress);

    const signUrl = await setTrustline(system_wallet, user_walletAddress);
    console.log('signUrl:', signUrl);
    res.json({
        url: signUrl
    });
});

/**
 * 引数のアドレスのアカウント情報を確認する
 * @param {Client} client xrpのnetwork
 * @param {string} walletAddress walletaddress
 */
async function checkAccountCurrencies(client, walletAddress) {
    await client.connect();
    try {
        const response = await client.request({
            command: 'account_currencies',
            account: walletAddress,
            ledger_index: 'validated'
        });
        console.log('AccountCurrencies:', response);
        await client.disconnect();
    } catch (error) {
        console.error(error.message);
    }
}

/**
 * トークンを受け取るためにトラストラインを設定する
 * xamanでQRを読み取り署名するため、QR表示のURLを返す
 * @param {Wallet} sysWallet トークン（PQR）の発行者のウォレット
 * @param {string} userAddress トークンの受領者の
 */
async function setTrustline(sysWallet,userAddress) {
    try {
        const trustSetPayload = {
            TransactionType: 'TrustSet',
            Account: userAddress,
            Flags: 131072, //tdSetNoRipple
            LimitAmount: {
                currency: 'PQR',
                issuer: sysWallet.classicAddress,
                value: '1000',
            }
        }

        const createdPayload = await xumm.payload.create(trustSetPayload);
        if(createdPayload.next && createdPayload.next.always){
            const signUrl = createdPayload.next.always;
            return signUrl;
        }else{
            throw new Error('Payload creation failed.');
        }
        
    } catch (error) {
        console.error('SetTrustline Error', error);
    }
}

module.exports = router;