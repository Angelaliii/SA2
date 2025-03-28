import os
import re
import uuid
from datetime import datetime

# 導入 Firebase 初始化模組
from firebase_init import bucket, db, firebase_admin, firebase_initialized
from flask import Blueprint, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

# 使用 Blueprint 替代直接創建 Flask 應用
app = Blueprint('club_register', __name__)
# 為 Blueprint 啟用 CORS
CORS(app)

# 設定上傳資料夾
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
# 確保上傳資料夾存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """檢查檔案類型是否允許上傳"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_club_data(data):
    """驗證社團資料"""
    errors = []
    # 檢查必要欄位
    required_fields = ['clubName', 'schoolName', 'clubType',
                      'contactName', 'contactPhone', 'email']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"缺少必要欄位: {field}")

    # 如果有任何錯誤，提前返回
    if errors:
        return False, errors

    # 電子郵件格式驗證
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
        errors.append("電子郵件格式不正確")

    return len(errors) == 0, errors

def process_club_files(club_id, request_files):
    """處理上傳的社團相關檔案"""
    file_urls = {}

    # 處理社團標誌
    if 'logo' in request_files:
        logo_file = request_files['logo']
        if logo_file and allowed_file(logo_file.filename):
            logo_url = upload_to_firebase(logo_file, 'club_logos', club_id)
            if logo_url:
                file_urls['logoUrl'] = logo_url

    # 處理社團證明文件
    if 'clubCertificate' in request_files:
        cert_file = request_files['clubCertificate']
        if cert_file and allowed_file(cert_file.filename):
            cert_url = upload_to_firebase(cert_file, 'club_certificates', club_id)
            if cert_url:
                file_urls['clubCertificateUrl'] = cert_url

    return file_urls

def upload_to_firebase(file, folder, file_id):
    """上傳檔案到 Firebase Storage"""
    if not firebase_initialized:
        return None

    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        destination_blob_name = f"{folder}/{file_id}_{secure_filename(file.filename)}"
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(file_path)

        # 設定檔案為公開可訪問
        blob.make_public()

        # 刪除本地暫存檔案
        os.remove(file_path)

        return blob.public_url
    except Exception as e:
        print(f"上傳檔案到 Firebase Storage 失敗: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        return None

@app.route('/api/register/club', methods=['POST'])
def register_club():
    """社團註冊 API 端點"""
    if not firebase_initialized:
        return jsonify({
            'success': False,
            'message': 'Firebase 服務未初始化',
            'error': '後端服務配置錯誤，請聯絡管理員'
        }), 500

    try:
        # 輸出請求內容，用於調試
        print(f"收到社團註冊請求，表單數據: {request.form}")
        print(f"檔案: {request.files}")

        # 處理表單數據
        club_data = {
            'clubName': request.form.get('clubName', ''),
            'schoolName': request.form.get('schoolName', ''),
            'clubType': request.form.get('clubType', ''),
            'contactName': request.form.get('contactName', ''),
            'contactPhone': request.form.get('contactPhone', ''),
            'email': request.form.get('email', ''),
            'clubDescription': request.form.get('clubDescription', ''),
            'cooperationFields': request.form.getlist('cooperationFields')
        }

        # 驗證資料
        is_valid, errors = validate_club_data(club_data)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': '資料驗證失敗',
                'error': errors
            }), 400

        # 生成唯一ID
        club_id = f"CLUB{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
        club_data['id'] = club_id
        club_data['registrationDate'] = datetime.now().isoformat()
        club_data['status'] = 'pending'  # 審核狀態：等待審核

        # 處理上傳檔案
        file_urls = process_club_files(club_id, request.files)
        club_data.update(file_urls)

        try:
            # 存儲到 Firestore
            db.collection('clubs').document(club_id).set(club_data)
            print(f"社團資料已成功保存到 Firestore，ID: {club_id}")

            # 返回成功響應
            return jsonify({
                'success': True,
                'message': '社團註冊申請已成功提交',
                'data': {
                    'clubId': club_id,
                    'registrationDate': club_data['registrationDate'],
                    'status': club_data['status']
                }
            }), 200

        except Exception as firebase_error:
            print(f"Firestore 操作失敗: {firebase_error}")
            return jsonify({
                'success': False,
                'message': '數據庫操作失敗',
                'error': str(firebase_error)
            }), 500

    except ValueError as e:
        print(f"資料處理錯誤: {e}")
        return jsonify({
            'success': False,
            'message': '資料格式錯誤',
            'error': str(e)
        }), 400

    except Exception as e:
        print(f"未預期的錯誤: {e}")
        return jsonify({
            'success': False,
            'message': '伺服器內部錯誤',
            'error': str(e)
        }), 500

# 用於測試
@app.route('/api/club-status', methods=['GET'])
def get_club_status():
    """取得社團審核狀態"""
    club_id = request.args.get('id', '')
    if not club_id:
        return jsonify({
            'success': False,
            'message': '缺少社團ID參數',
        }), 400

    if not firebase_initialized:
        return jsonify({
            'success': False,
            'message': 'Firebase 服務未初始化',
        }), 500

    try:
        club_doc = db.collection('clubs').document(club_id).get()
        if club_doc.exists:
            club_data = club_doc.to_dict()
            return jsonify({
                'success': True,
                'data': {
                    'clubId': club_id,
                    'status': club_data.get('status', 'unknown'),
                    'registrationDate': club_data.get('registrationDate', '')
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '找不到此社團資料'
            }), 404

    except Exception as e:
        print(f"獲取社團狀態失敗: {e}")
        return jsonify({
            'success': False,
            'message': '獲取社團狀態失敗',
            'error': str(e)
        }), 500
