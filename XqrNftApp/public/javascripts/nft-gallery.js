const ws = new WebSocket('wss://s.altnet.rippletest.net:51233/');

ws.onopen = function() {
    console.log('WebSocket connection opened');

    // アカウントのトランザクション履歴を取得
    const accountTxRequest = {
        "id": 1,
        "command": "account_tx",
        "account": "rw12FhB9VAmgjd2edvev5mcGiXNZEcNFVE", 
        "binary": false,
        "forward": false,
        "limit": 10 // 最大10件のトランザクションを取得
    };
    ws.send(JSON.stringify(accountTxRequest));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);

    if (data.status === 'success' && data.result) {
        // 最新のトランザクションから3件を取得
        const transactions = data.result.transactions;
        console.log('Transactions:', transactions);

        // 最新の3件のトランザクションを選択
        const latestTransactions = transactions.slice(0, 3);
        
        // トランザクションのAmountを抽出
        const amounts = latestTransactions.map(tx => {
            const txn = tx.tx;
            // トランザクションのタイプによってAmountの取得方法が異なる
            if (txn.TransactionType === 'NFTokenCreateOffer' || txn.TransactionType === 'NFTokenAcceptOffer') {
                // NFTのオファー関連のトランザクション
                return txn.Amount || 'No amount found';
            } else if (txn.TransactionType === 'Payment') {
                // 通常のPaymentトランザクション
                return txn.Amount || 'No amount found';
            } else {
                // その他のトランザクションタイプ
                return 'No amount found';
            }
        });

        // amounts-infoの内容をクリア
        const amountsDiv = document.getElementById('amounts-info');
        amountsDiv.innerHTML = '';
        // 例として画像の CID を指定

// fetchImageFromIPFS(imageCID);
const imageCID = 'QmchR6tcGpcicb1jMP2N6uEDvummiHqQm7dpZMc2Zpqyjt'; // 一旦仮のもの
    const imageUrl = `https://ipfs.io/ipfs/${imageCID}`;
    // const imageDiv = document.getElementById('ipfs-image');

        // 最新の3件のAmount情報をHTMLに表示
        amountsDiv.innerHTML = amounts.map((amount, index) => `
            <div class="amount-item">
                <img src="${imageUrl}" alt="IPFS Image" style="max-width: 80%; height: auto;">
                <div>${amount} XPR</div>
                <button class="checkout-button" data-index="${index}">Check Out</button>
            </div>
        `).join('');

        // ボタンのクリック処理を設定
        setupButtons();
    } else {
        console.error('Received unexpected data:', data);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function() {
    console.log('WebSocket connection closed');
};

// ボタンのクリック処理
function setupButtons() {
    document.querySelectorAll('.checkout-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            if (index !== null) {
                alert(`Check Out ボタン ${parseInt(index, 10) + 1} がクリックされました！`);
                // ここに各ボタンクリック時の処理を追加
            } else {
                console.error('Button index is missing.');
            }
        });
    });
}
