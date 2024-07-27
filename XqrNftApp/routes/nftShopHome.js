const express = require('express');
const router = express.Router();

// GETリクエストに対する処理
router.get('/', async function (req, res, next) {
  try {
    // ここで必要なデータを取得する処理などを行う

    // レンダリングするテンプレートを指定して、必要なデータを渡す
    res.render('nftShopHome', { /* 必要なデータ */ });
  } catch (error) {
    next(error); // エラーが発生した場合は次のミドルウェアにエラーを渡す
  }
});

module.exports = router;
