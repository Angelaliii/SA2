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
app = Blueprint('company_register', __name__)

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

def validate_company_data(data):
    """驗證企業資料"""
    errors = []
    # 檢查必要欄位
    required_fields = ['companyName', 'businessId', 'industryType',
                      'contactName', 'contactPhone', 'email']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"缺少必要欄位: {field}")

    # 如果有任何錯誤，提前返回
    if errors:
        return False, errors

    # 統一編號格式驗證 (8位數字)
    if not re.match(r'^\d{8}$', data['businessId']):
        errors.append("統一編號格式不正確，必須是8位數字")

    # 電子郵件格式驗證
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
        errors.append("電子郵件格式不正確")

    return len(errors) == 0, errors

def upload_to_firebase(file, folder, file_id):
    """上傳檔案到 Firebase Storage"""
    if not firebase_initialized:
        print("Firebase 未初始化，無法上傳檔案")
        return None

    file_path = None
    try:
        # 確保上傳資料夾存在
        if not os.path.exists(UPLOAD_FOLDER):
            print(f"正在創建上傳資料夾: {UPLOAD_FOLDER}")
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        print(f"正在保存檔案到: {file_path}")
        file.save(file_path)

        destination_blob_name = f"{folder}/{file_id}_{secure_filename(file.filename)}"
        print(f"正在上傳檔案至 Firebase Storage: {destination_blob_name}")
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(file_path)

        # 設定檔案為公開可訪問
        blob.make_public()
        
        file_url = blob.public_url
        print(f"檔案上傳成功，公開URL: {file_url}")

        # 刪除本地暫存檔案
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"已刪除本地暫存檔案: {file_path}")

        return file_url
    except (IOError, firebase_admin.exceptions.FirebaseError) as e:
        print(f"上傳檔案到 Firebase Storage 失敗: {e}")
        # 清理文件
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"已刪除失敗的本地暫存檔案: {file_path}")
            except IOError as cleanup_error:
                print(f"清理暫存檔案失敗: {cleanup_error}")
        return None

def process_company_files(company_id, request_files):
    """處理上傳的公司相關檔案"""
    file_urls = {}

    # 處理公司 Logo
    if 'logo' in request_files:
        logo_file = request_files['logo']
        if logo_file and allowed_file(logo_file.filename):
            logo_url = upload_to_firebase(logo_file, 'company_logos', company_id)
            if logo_url:
                file_urls['logoUrl'] = logo_url

    # 處理營業證明文件
    if 'businessCertificate' in request_files:
        cert_file = request_files['businessCertificate']
        if cert_file and allowed_file(cert_file.filename):
            cert_url = upload_to_firebase(cert_file, 'business_certificates', company_id)
            if cert_url:
                file_urls['businessCertificateUrl'] = cert_url

    return file_urls

@app.route('/api/register/company', methods=['POST'])
def register_company():
    """企業註冊 API 端點"""
    print("Firebase 初始化狀態:", firebase_initialized)
    if not firebase_initialized:
        return jsonify({
            'success': False,
            'message': 'Firebase 服務未初始化',
            'error': '後端服務配置錯誤，請聯絡管理員'
        }), 500

    try:
        # 輸出請求內容，用於調試
        print(f"收到註冊請求，表單數據: {request.form}")
        print(f"檔案: {request.files}")

        # 處理表單數據
        company_data = {
            'companyName': request.form.get('companyName', ''),
            'businessId': request.form.get('businessId', ''),
            'industryType': request.form.get('industryType', ''),
            'contactName': request.form.get('contactName', ''),
            'contactPhone': request.form.get('contactPhone', ''),
            'email': request.form.get('email', ''),
            'companyDescription': request.form.get('companyDescription', ''),
            'cooperationFields': request.form.getlist('cooperationFields')
        }

        # 驗證資料
        is_valid, errors = validate_company_data(company_data)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': '資料驗證失敗',
                'error': errors
            }), 400

        # 生成唯一ID
        company_id = f"COMP{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
        company_data['id'] = company_id
        company_data['registrationDate'] = datetime.now().isoformat()
        company_data['status'] = 'pending'  # 審核狀態：等待審核

        # 處理上傳檔案
        file_urls = process_company_files(company_id, request.files)
        company_data.update(file_urls)

        try:
            # 存儲到 Firestore
            db.collection('companies').document(company_id).set(company_data)
            print(f"公司資料已成功保存到 Firestore，ID: {company_id}")

            # 返回成功響應
            return jsonify({
                'success': True,
                'message': '企業註冊申請已成功提交',
                'data': {
                    'companyId': company_id,
                    'registrationDate': company_data['registrationDate'],
                    'status': company_data['status']
                }
            }), 200

        except firebase_admin.exceptions.FirebaseError as firebase_error:
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

    except firebase_admin.exceptions.FirebaseError as e:
        print(f"Firebase 操作錯誤: {e}")
        return jsonify({
            'success': False,
            'message': 'Firebase 操作錯誤',
            'error': str(e)
        }), 500

    except IOError as e:
        print(f"檔案處理錯誤: {e}")
        return jsonify({
            'success': False,
            'message': '檔案處理錯誤',
            'error': str(e)
        }), 500

    except (TypeError, AttributeError) as e:
        print(f"資料類型或屬性錯誤: {e}")
        return jsonify({
            'success': False,
            'message': '資料處理錯誤',
            'error': str(e)
        }), 500

# 用於測試
@app.route('/api/company-status', methods=['GET'])
def get_company_status():
    """取得公司審核狀態"""
    company_id = request.args.get('id', '')
    if not company_id:
        return jsonify({
            'success': False,
            'message': '缺少公司ID參數',
        }), 400

    if not firebase_initialized:
        return jsonify({
            'success': False,
            'message': 'Firebase 服務未初始化',
        }), 500

    try:
        company_doc = db.collection('companies').document(company_id).get()
        if company_doc.exists:
            company_data = company_doc.to_dict()
            return jsonify({
                'success': True,
                'data': {
                    'companyId': company_id,
                    'status': company_data.get('status', 'unknown'),
                    'registrationDate': company_data.get('registrationDate', '')
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '找不到此公司資料'
            }), 404

    except (firebase_admin.exceptions.FirebaseError, ValueError) as e:
        print(f"獲取公司狀態失敗: {e}")
        return jsonify({
            'success': False,
            'message': '獲取公司狀態失敗',
            'error': str(e)
        }), 500
