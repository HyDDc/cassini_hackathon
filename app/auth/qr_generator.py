import qrcode

login_url = "http://10.18.234.150:8000/qr-login"
img = qrcode.make(login_url)
img.save("static_qr.png")
