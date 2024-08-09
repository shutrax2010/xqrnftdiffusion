const express = require('express');
const xrpl = require('xrpl');
const router = express.Router();
const axios = require('axios'); // 必要に応じてaxiosをインポートする

// ダミーアカウントのアドレス
const dummyAccountAddress = process.env.DUMMY_USER_ACCOUNT;
const dummyPrivateKey = process.env.DUMMY_USER_PRIVATE_KEY; // ダミーアカウントのプライベートキーも追加する

// 購入処理
async function purchaseNFT(nftId) {
    const net = process.env.TEST_NET; // XRPLのネットワークを指定
    const client = new xrpl.Client(net);
    try {
        await client.connect();

        const wallet = xrpl.Wallet.fromSecret(dummyPrivateKey);

        // NFTの購入オファーを作成
        const transaction = {
            TransactionType: 'NFTokenMint',
            Account: wallet.classicAddress,
            NFTokenID: nftId,
            // その他必要なパラメータ
        };

        const preparedTx = await client.autofill(transaction);
        const signedTx = wallet.sign(preparedTx);
        const txResponse = await client.submitAndWait(signedTx.tx_blob);

        client.disconnect();
        return txResponse.result.meta.TransactionResult === 'tesSUCCESS'; // 成功かどうかを返す
    } catch (error) {
        console.error('NFTの購入中にエラーが発生しました:', error);
        return false;
    }
}

// 購入リクエストのハンドラー
router.post('/purchase', async (req, res, next) => {
    try {
        const nftId = req.body.nftId; // リクエストボディからNFT IDを取得

        // NFTを購入
        const success = await purchaseNFT(nftId);

        if (success) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('購入処理中にエラーが発生しました:', error);
        res.status(500).json({ success: false });
    }
});


async function getNFTs(walletAddress) {
    const net = process.env.TEST_NET; // XRPLのネットワークを指定

    const client = new xrpl.Client(net);
    try {
        await client.connect();

        const nftsResponse = await client.request({
            method: 'account_nfts',
            account: walletAddress
        });

        const nfts = await Promise.all(nftsResponse.result.account_nfts.map(async nft => {
            let imageUrl = ''; // 画像URLの初期化
            let name = '';
            let offers = '';
            let NFTokenTaxon = nft.NFTokenTaxon;

            const uri = nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null; // URIを16進数からデコード

            if (!uri || uri === "") {
                name = "Unnamed NFT";
                return null; // URIが存在しない場合はnullを返す
            }

            // URIが存在する場合は、IPFSやHTTP経由で情報を取得するロジックを実装
            try {
                let response;
                if (uri.startsWith('ipfs://')) {
                    // IPFS経由での情報取得
                    const ipfsJson = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + uri.slice(7) + "?pinataGatewayToken=" + process.env.PINATA_GATEWAY_KEY;
                    response = await axios.get(ipfsJson);
                }

                if (response && response.data) {
                    name = response.data.name || 'Unnamed NFT';
                    const url = response.data.image || response.data.QRImage;
                    if (url && (url.startsWith('ipfs://'))) {
                        imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(7) + "?pinataGatewayToken=" + process.env.PINATA_GATEWAY_KEY;
                    } else if (url && url.startsWith('https://ipfs.io/ipfs/')) {
                        imageUrl = "https://amethyst-raw-termite-956.mypinata.cloud/ipfs/" + url.slice(21) + "?pinataGatewayToken=" + process.env.PINATA_GATEWAY_KEY;
                    }
                     else {
                        imageUrl = ''; // 画像URLが無効な場合は空にする
                    }
                }
            } catch (error) {
                name = uri;
                console.error(`URI ${uri} からのNFTデータの取得中にエラーが発生しました:`, error);
            }

            // NFTのセールオファーを取得
            try {
                const offersResponse = await client.request({
                    method: 'nft_sell_offers',
                    nft_id: nft.NFTokenID
                });

                if (offersResponse.data && offersResponse.data.error && offersResponse.data.error === 'objectNotFound') {
                    console.warn(`NFT ${nft.NFTokenID} は存在しないか削除されています。スキップします。`);
                    return null; // NFTが存在しない場合はnullを返してスキップ
                }

                if (offersResponse.result.offers) {
                    offers = offersResponse.result.offers.filter(offer => offer.owner === walletAddress);
                }
            } catch (offerError) {
                // console.error(NFT ${nft.NFTokenID} のセールオファーの取得中にエラーが発生しました:, offerError);
                console.warn(`NFT ${nft.NFTokenID} のセールオファーの取得中にエラーが発生しました。スキップします。`);
                return null; // セールオファーの取得でエラーが発生した場合も、nullを返してスキップ
            }

            return {
                id: nft.NFTokenID,
                name,
                uri: nft.URI || 'N/A',
                imageUrl,
                offers,
                NFTokenTaxon
            };
        }));

        // nullをフィルタリングして正常に取得できたNFTのみを残す
        const filteredNFTs = nfts.filter(nft => nft !== null);

        client.disconnect();
        return filteredNFTs;
    } catch (error) {
        console.error('NFTの取得中にエラーが発生しました:', error);
        throw error;
    }
}

// GETリクエストのハンドラー
router.get('/', async function (req, res, next) {
    try {
        const walletAddress = dummyAccountAddress; // 仮のウォレットアドレス

        // NFT情報を取得
        const nfts = await getNFTs(walletAddress);

        console.log(nfts);
        // 取得したNFT情報をnftShop.ejsに渡してレンダリング
        res.render('nftShop', { nfts });
    } catch (error) {
        console.error('NFTの取得中にエラーが発生しました:', error);
        next(error); // エラーが発生した場合は次のミドルウェアにエラーを渡す
    }
});

module.exports = router;
