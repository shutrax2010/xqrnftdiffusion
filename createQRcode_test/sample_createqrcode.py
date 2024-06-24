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
	json_data = request.form['jsonData']
	json_data = json.loads(json_data)  # JSON文字列をPythonオブジェクトに変換
	
	qr_data = json.dumps(json_data)  # JSONデータを文字列に変換してQRコードのデータとする
	qr = qrcode.make(qr_data)
	
	img_byte_array = io.BytesIO()
	img.save(img_byte_array, format='PNG')
	img_byte_array.seek(0)
	
	# IPFSへのファイルのピン留め（アップロード）
	url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
	files = {'file': ('qrcode.png', img_byte_array, 'image/png')}
	headers = {
		'pinata_api_key': "7889b920748ef631b2b0",
		'pinata_secret_api_key': "d8f3b545743f4760ec2937d3faf4df60b481a28b9b7d1c83c16ba72685455db4"
	}
	response = requests.post(url, files=files, headers=headers)
	
	# 一時ファイルを削除
	img_byte_array.close()
	
	getUrl = 'https://gateway.pinata.cloud/ipfs/' + response.json()["IpfsHash"]
	return getUrl
        
if __name__ == '__main__':
    app.run(debug=True)
