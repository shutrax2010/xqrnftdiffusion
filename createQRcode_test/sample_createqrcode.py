import os
import requests
import io
import qrcode
from PIL import Image
from flask import Flask, send_file
app = Flask(__name__)

@app.route('/')
def index():
   img = qrcode.make("test_createQRcode")
   img_byte_array = io.BytesIO()
   img.save(img_byte_array, format='PNG')
   img_byte_array.seek(0)
   
   return send_file(img_byte_array, mimetype='image/png', as_attachment=True, download_name='test_createQRcode.png')

if __name__ == '__main__':
    app.run(debug=True)
