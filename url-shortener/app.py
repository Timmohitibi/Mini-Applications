from flask import Flask, request, jsonify, redirect
import string
import random
import json
import os

app = Flask(__name__)

# Simple file-based storage
DATA_FILE = 'urls.json'

def load_urls():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_urls(urls):
    with open(DATA_FILE, 'w') as f:
        json.dump(urls, f)

def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@app.route('/')
def home():
    return jsonify({
        'message': 'URL Shortener API',
        'endpoints': {
            'POST /shorten': 'Shorten a URL',
            'GET /<short_code>': 'Redirect to original URL',
            'GET /stats/<short_code>': 'Get URL statistics'
        }
    })

@app.route('/shorten', methods=['POST'])
def shorten_url():
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    original_url = data['url']
    
    # Basic URL validation
    if not original_url.startswith(('http://', 'https://')):
        original_url = 'https://' + original_url
    
    urls = load_urls()
    
    # Check if URL already exists
    for code, info in urls.items():
        if info['original_url'] == original_url:
            return jsonify({
                'short_url': f'http://localhost:5000/{code}',
                'original_url': original_url,
                'short_code': code
            })
    
    # Generate new short code
    short_code = generate_short_code()
    while short_code in urls:
        short_code = generate_short_code()
    
    urls[short_code] = {
        'original_url': original_url,
        'clicks': 0,
        'created_at': str(datetime.now()) if 'datetime' in globals() else 'N/A'
    }
    
    save_urls(urls)
    
    return jsonify({
        'short_url': f'http://localhost:5000/{short_code}',
        'original_url': original_url,
        'short_code': short_code
    })

@app.route('/<short_code>')
def redirect_url(short_code):
    urls = load_urls()
    
    if short_code not in urls:
        return jsonify({'error': 'URL not found'}), 404
    
    # Increment click count
    urls[short_code]['clicks'] += 1
    save_urls(urls)
    
    return redirect(urls[short_code]['original_url'])

@app.route('/stats/<short_code>')
def get_stats(short_code):
    urls = load_urls()
    
    if short_code not in urls:
        return jsonify({'error': 'URL not found'}), 404
    
    return jsonify({
        'short_code': short_code,
        'original_url': urls[short_code]['original_url'],
        'clicks': urls[short_code]['clicks'],
        'created_at': urls[short_code].get('created_at', 'N/A')
    })

if __name__ == '__main__':
    app.run(debug=True)