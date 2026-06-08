import os
import random
import time
import json
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'history.json')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 Megabytes

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# List of hilarious siks-themed alien forms
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
        # 1. Save file with unique timestamp prefix (retaining all history)
        orig_filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{orig_filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        
        # 2. Extract hero info
        hero_name = request.form.get('hero_name', 'Unnamed Sidi').strip()
        hero_bio = request.form.get('hero_bio', 'No comment habibi').strip()
        
        if not hero_name:
            hero_name = "Unnamed Sidi"
        if not hero_bio:
            hero_bio = "No comment habibi"
        
        # 3. Generate random alien name
        alien_name = random.choice(ALIEN_NAMES)
        
        # 4. Log in JSON history database
        history = []
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except Exception as e:
                app.logger.error(f"Error reading history.json: {e}")
                
        record = {
            'filename': filename,
            'hero_name': hero_name,
            'alien_name': alien_name,
            'hero_bio': hero_bio,
            'timestamp': int(time.time())
        }
        history.append(record)
        
        try:
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=4, ensure_ascii=False)
        except Exception as e:
            app.logger.error(f"Error writing history.json: {e}")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'alien_name': alien_name
        })
        
    return jsonify({'success': False, 'error': 'File type not allowed. Images only!'}), 400

@app.route('/history', methods=['GET'])
def get_history():
    history = []
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception as e:
            app.logger.error(f"Error reading history.json: {e}")
            
    # Return history sorted by newest first
    history.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    return jsonify(history)

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'success': False, 'error': 'File is too large! Maximum allowed size is 5MB.'}), 413

if __name__ == '__main__':
    # Running Flask in debug mode
    app.run(debug=True, host='0.0.0.0', port=5000)

