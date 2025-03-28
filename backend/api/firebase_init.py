import json
import os

import firebase_admin
# 導入 dotenv 來載入環境變數
from dotenv import load_dotenv
from firebase_admin import credentials, firestore, storage

# 載入環境變數
load_dotenv()

# Firebase 專案 ID 和 Storage Bucket
FIREBASE_PROJECT_ID = "fjusa-75609"
FIREBASE_STORAGE_BUCKET = "fjusa-75609.firebasestorage.app"
# Firebase 初始化標誌
firebase_initialized = False
db = None
bucket = None

try:
    # 嘗試從環境變數獲取憑證
    firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')
    cred_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    
    if firebase_creds_json:
        # 使用環境變數中的憑證
        print("從環境變數獲取憑證")
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {
                'storageBucket': FIREBASE_STORAGE_BUCKET
            })
    # 嘗試使用服務帳號憑證初始化
    elif os.path.exists(cred_path):
        print(f"找到憑證檔案: {cred_path}")
        cred = credentials.Certificate(cred_path)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {
                'storageBucket': FIREBASE_STORAGE_BUCKET
            })
    else:
        # 如果找不到憑證檔案，則使用預設憑證
        print(f"找不到憑證，嘗試使用預設憑證")
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={
                'projectId': FIREBASE_PROJECT_ID,
                'storageBucket': FIREBASE_STORAGE_BUCKET
            })
    
    db = firestore.client()
    bucket = storage.bucket()
    firebase_initialized = True
    print("Firebase 初始化成功")
except ImportError as e:
    print(f"Firebase 相關模組未安裝: {e}")
    firebase_initialized = False
except (ValueError, firebase_admin.exceptions.FirebaseError) as e:
    print(f"Firebase 初始化錯誤: {e}")
    firebase_initialized = False

def get_db():
    """獲取 Firestore 資料庫實例"""
    return db

def get_storage_bucket():
    """獲取 Firebase Storage 實例"""
    return bucket

def is_initialized():
    """檢查 Firebase 是否成功初始化"""
    return firebase_initialized