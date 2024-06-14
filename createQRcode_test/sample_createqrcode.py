import os
import requests
import io
import qrcode
from PIL import Image
from flask import Flask, send_file, render_template, request
app = Flask(__name__)

@app.index('/', methods=['GET', 'POST'])
def result():
   if request.method == 'POST':
        name = request.form['testText']
        img = qrcode.make(name)
        img_byte_array = io.BytesIO()
        img.save(img_byte_array, format='PNG')
        img_byte_array.seek(0)   
        img.save('test_createQRcode.png')
        
        with open('test_createQRcode.png', "rb") as q:
	        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
	        files = [
	        ('file', ('test_createQRcode.png',q )),
	        ]
	        headers = {
	        'pinata_api_key': "ef4b2776bda587ee59df",
	        'pinata_secret_api_key': "668688893b3ee64dcfdcc2b8ba801ecda95d916fdc307bd21f8d8351be86940c"
	        }
	        response = requests.request("POST", url, files=files, headers=headers)
	        print(response.text)
	        
	        q.close()
        os.remove('test_createQRcode.png')
        
        getUrl = 'https://gateway.pinata.cloud/ipfs/' + response.json()["IpfsHash"]
        return getUrl
        
if __name__ == '__main__':
    app.run(debug=True)
