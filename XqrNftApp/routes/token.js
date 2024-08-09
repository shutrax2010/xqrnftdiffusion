var express = require('express');
var router = express.Router();
const xrpl = require('xrpl');
const { XummSdk } = require('xumm-sdk');

const xummApiKey = process.env.XUMM_APIKEY;
const xummSecret = process.env.XUMM_APISECRET;
const xumm = new XummSdk(xummApiKey,xummSecret);

const { isAuthenticated } = require('../authMiddleware');
const res = require('express/lib/response');

const sys_walletAddress = process.env.SYS_WALLET_ADDRESS;
let user_walletAddress = '';

/** 初期表示 */
router.get('/', isAuthenticated, async function(req, res, next) {
    const net = process.env.TEST_NET;
    const client = new xrpl.Client(net);
    if (req.session.authenticated) {
        user_walletAddress = req.session.account;
        const hasTrustline = await hasTrustlineForPqr(client, user_walletAddress);
        console.log('hasTrustLine', hasTrustline);
        req.session.trustline = hasTrustline;
        
        res.render('token',{
            walletAddress: user_walletAddress,
            trustline: req.session.trustline
        });
    }
});

/** Trustlineを設定する */
router.post('/setTrustline', async function(req, res, next) {
    const net = process.env.TEST_NET;
    const client = new xrpl.Client(net);
    

    const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
    
    
    const hasTrustline = await hasTrustlineForPqr(client, user_walletAddress);
    console.log(hasTrustline);
    if(hasTrustline) {
        console.log(hasTrustline);
        return res.json({
            hasTrustline: hasTrustline,
        });
    }

    const payload = await setTrustline(system_wallet, user_walletAddress);

    res.json(payload);
});

router.get('/payload/:payload_uuid', async function(req,res, next) {
    const payloadUuid = req.params.payload_uuid;

    try{
        const payloadData = await xumm.payload.get(payloadUuid);
        const status = payloadData.meta.signed ? 'completed' : 'in_progress';
        const resolved = payloadData.meta.resolved ? true : false;
        
        res.json({
            status,
            resolved
        });
    }catch(error){
        console.error('Error fetching payload data:', error);
    }
});

//'Claim tokens'押下
router.post('/claim', async function(req, res, next) {
    const net = process.env.TEST_NET;
    const client = new xrpl.Client(net);
    const system_wallet = xrpl.Wallet.fromSeed(process.env.SYS_WALLET_SEED);
    const isClaimedToday = await isClaimedPQRToday(client,user_walletAddress);

    if(isClaimedToday){ //同日中に配布済みの場合
        return res.json({
            errorMsg:'Sorry, tokens can only be claimed once per day.'
        });
    }
    const response = await paymentToken(client, system_wallet,user_walletAddress);
    const result = response.result.meta.TransactionResult === 'tesSUCCESS' ? 'success' : 'failed';
    res.json({
        result,
    });
})

/**
 * 引数のアドレスのアカウント情報を確認する
 * @param {Client} client xrpのnetwork
 * @param {string} walletAddress walletaddress
 * @returns response アカウント情報
 */
async function checkAccountCurrencies(client, walletAddress) {
    await client.connect();
    try {
        const response = await client.request({
            command: 'account_currencies',
            account: walletAddress,
            ledger_index: 'validated'
        });
        // console.log('AccountCurrencies:', response);
        
        await client.disconnect();
        return response;
    } catch (error) {
        console.error(error.message);
        return null;
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

        return createdPayload;
        
    } catch (error) {
        console.error('SetTrustline Error', error);
    }
}

/**
 * 
 * @param {*} client xrpのnetwork
 * @param {*} userAddress ユーザのウォレットアドレス
 * @returns true:トラストライン設定済み / false: トラストライン未設定
 */
async function hasTrustlineForPqr(client, userAddress) {
    await client.connect();
    const response = await client.request({
        command: 'account_lines',
        account: userAddress
    });
    console.log(response);
    const trustlines = response.result.lines;

    for(const line of trustlines) {
        if(line.currency === 'PQR' && line.account === process.env.SYS_WALLET_ADDRESS){
            return true;
        }
    }
    return false;
}

/**
 * ユーザにPQRを10配布する
 * @param {Client} client xrpのnetwork
 * @param {Wallet} sysWallet システムのウォレット
 * @param {String} userAddress ユーザのウォレットアドレス
 * @returns トランザクションの結果
 */
async function paymentToken(client, sysWallet, userAddress){
    await client.connect();
    try{
        const response = await client.submitAndWait({
            TransactionType: 'Payment',
            Account: sysWallet.classicAddress,
            Destination: userAddress,
            Amount: {
                issuer: sysWallet.classicAddress,
                currency: 'PQR',
                value: '10',
            },
            
        },
        { wallet: sysWallet });

        return response;
    } catch (error){
        console.error('Payment Error:',error);
        return error;
    }
}

/**
 * 同日中にPQRを配布済みか判定する
 * @param {Client} client xrpのnetwork
 * @param {string} userAddress ユーザのウォレットアドレス
 * @returns true:今日PQRを受け取った / false: 今日はPQRを受け取っていない
 */
async function isClaimedPQRToday(client, userAddress) {//英語的にメソッド名おかしいかも？
    await client.connect();
    const targetDate = new Date();//今日
    // console.log(targetDate);//2024-07-28T06:55:58.782Z
    const startTime = Math.floor(targetDate.setUTCHours(0,0,0,0) / 1000);
    const endTime = Math.floor(targetDate.setUTCHours(23,59,59,999) / 1000);

    const response = await client.request({
        command: 'account_tx',
        account: userAddress,
        ledger_index_min: -1,
        ledger_index_max: -1,
        forward: false,
    });

    for(const tx of response.result.transactions) {
        if(tx.tx.TransactionType === 'Payment'
            && tx.tx.Destination === userAddress
            && tx.meta.delivered_amount.currency === 'PQR') {
            // console.log('forの中', tx);
            const txTime = tx.tx.date + 946684800; // Rippleの時間は2000年1月1日からの秒数なので、UNIX時間に変換
            console.log('txTime:',txTime);
            console.log('start,end: ' + startTime + ', ' + endTime);
            if(txTime >= startTime && txTime <= endTime) {
                console.log('true');
                await client.disconnect();
                return true;
            }
        }
    }
    await client.disconnect();
    return false;
}   

module.exports = router;