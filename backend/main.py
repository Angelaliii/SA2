import os

from api.club_register import app as club_register_app
from api.company_register import app as company_register_app
from flask import Flask
from flask_cors import CORS

# 主應用程序
app = Flask(__name__)
CORS(app)  # 啟用 CORS 支援，允許跨域請求

# 註冊藍圖 (Blueprints)
app.register_blueprint(company_register_app)
app.register_blueprint(club_register_app)

# 根路由 - 用於健康檢查
@app.route('/')
def index():
    return {
        'status': 'ok',
        'message': 'SA Platform API Server is running'
    }

# 當直接執行此檔案時啟動 Flask 應用
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)