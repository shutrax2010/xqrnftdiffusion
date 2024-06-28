import os
import requests
import io
import qrcode
import json
from flask import Flask, send_file, render_template, request, jsonify
from flask_cors import CORS
app = Flask(__name__)	
CORS(app)  # CORSを全てのエンドポイントに対して有効にする

@app.route('/', methods=['POST'])
def index():
	json_data = request.json
	
	qr_data = json.dumps(json_data)  # JSONデータを文字列に変換してQRコードのデータとする
	qr = qrcode.make(qr_data)
	
	img_byte_array = io.BytesIO()
	qr.save(img_byte_array, format='PNG')
	img_byte_array.seek(0)
	
	# IPFSへのファイルのピン留め（アップロード）
	url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
	files = {'file': ('qrcode.png', img_byte_array, 'image/png')}
	headers = {
		'pinata_api_key': "ef4b2776bda587ee59df",
		'pinata_secret_api_key': "668688893b3ee64dcfdcc2b8ba801ecda95d916fdc307bd21f8d8351be86940c"
	}
	response = requests.post(url, files=files, headers=headers)
	
	# 一時ファイルを削除
	img_byte_array.close()
	
	getUrl = 'ipfs://' + response.json()["IpfsHash"]
	return getUrl
        
if __name__ == '__main__':
    app.run(debug=True)
