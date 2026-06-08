import os
import random
import time
import json
import uuid
import requests
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024   # 5 MB

# Firebase Realtime Database base URL (from your project)
FIREBASE_DB_URL = os.environ.get(
    'FIREBASE_DB_URL',
    'https://amadmax-72d24-default-rtdb.firebaseio.com'
)

# Firebase Storage bucket  (set this env var on Render)
# Format: "<project-id>.appspot.com"  or your custom bucket name
FIREBASE_STORAGE_BUCKET = os.environ.get(
    'FIREBASE_STORAGE_BUCKET',
    'amadmax-72d24.appspot.com'
)

# Firebase Web API Key  (set this env var on Render – found in Firebase console → Project Settings → General)
FIREBASE_API_KEY = os.environ.get('FIREBASE_API_KEY', '')

# ─── Local fallback upload folder (used when Firebase creds are missing) ──────
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ─── Local history DB (JSON file) ─────────────────────────────────────────────
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'history.json')

# ─── Alien names ──────────────────────────────────────────────────────────────
ALIEN_NAMES = [
    "Siks Galaxy",
    "Siks Prime",
    "El Siks Cosmic",
    "Siks Intergalactic",
    "Sidi Siks the Destroyer",
    "Siks Man Ultra"
]


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_to_firebase_storage(file_bytes, content_type, dest_filename):
    """
    Upload raw bytes to Firebase Storage using the REST API.
    Returns the public download URL or None on failure.
    """
    if not FIREBASE_API_KEY:
        return None

    url = (
        f"https://firebasestorage.googleapis.com/v0/b/"
        f"{FIREBASE_STORAGE_BUCKET}/o?"
        f"uploadType=media&name=uploads%2F{dest_filename}"
    )
    headers = {
        'Content-Type': content_type,
        'X-Firebase-API-Key': FIREBASE_API_KEY,
    }
    try:
        resp = requests.post(url, data=file_bytes, headers=headers, timeout=30)
        resp.raise_for_status()
        token = resp.json().get('downloadTokens', '')
        public_url = (
            f"https://firebasestorage.googleapis.com/v0/b/"
            f"{FIREBASE_STORAGE_BUCKET}/o/uploads%2F{dest_filename}"
            f"?alt=media&token={token}"
        )
        return public_url
    except Exception as e:
        app.logger.error(f"Firebase Storage upload error: {e}")
        return None


def save_record_to_firebase(record):
    """Push a mutation record to the Firebase Realtime Database."""
    try:
        url = f"{FIREBASE_DB_URL}/history.json"
        resp = requests.post(url, json=record, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        app.logger.error(f"Firebase DB write error: {e}")


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part in request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        orig_filename = secure_filename(file.filename)
        unique_name = f"{int(time.time())}_{uuid.uuid4().hex[:6]}_{orig_filename}"

        file_bytes = file.read()
        content_type = file.mimetype or 'image/jpeg'

        # Try Firebase Storage first; fall back to local disk
        firebase_url = upload_to_firebase_storage(file_bytes, content_type, unique_name)
        if firebase_url:
            image_url = firebase_url
        else:
            # Local fallback
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
            with open(save_path, 'wb') as f:
                f.write(file_bytes)
            image_url = f"/static/uploads/{unique_name}"

        hero_name = request.form.get('hero_name', 'Unnamed Sidi').strip() or "Unnamed Sidi"
        hero_bio  = request.form.get('hero_bio',  'No comment habibi').strip() or "No comment habibi"
        alien_name = random.choice(ALIEN_NAMES)

        record = {
            'filename':   unique_name,
            'image_url':  image_url,
            'hero_name':  hero_name,
            'alien_name': alien_name,
            'hero_bio':   hero_bio,
            'timestamp':  int(time.time())
        }

        # Save to Firebase Realtime DB
        save_record_to_firebase(record)

        # Also save locally as fallback
        history = []
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except Exception:
                pass
        history.append(record)
        try:
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=4, ensure_ascii=False)
        except Exception as e:
            app.logger.error(f"Local history write error: {e}")

        return jsonify({
            'success':    True,
            'filename':   unique_name,
            'image_url':  image_url,
            'alien_name': alien_name
        })

    return jsonify({'success': False, 'error': 'File type not allowed. Images only!'}), 400


@app.route('/history', methods=['GET'])
def get_history():
    """Return mutation history — try Firebase first, fall back to local JSON."""
    records = []
    try:
        url = f"{FIREBASE_DB_URL}/history.json"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            records = list(data.values())
        elif isinstance(data, list):
            records = [r for r in data if r]
    except Exception as e:
        app.logger.warning(f"Firebase history fetch failed, using local: {e}")
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    records = json.load(f)
            except Exception:
                pass

    records.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    return jsonify(records)


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'success': False, 'error': 'File too large! Max 5 MB.'}), 413


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
