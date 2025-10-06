from flask import Flask, render_template_string, jsonify
import time
import threading

app = Flask(__name__)

request_count = 0
request_lock = threading.Lock()

VICTIM_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Victim Service - Online Store</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 20px;
        }
        .products {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .product {
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .product:hover {
            transform: translateY(-5px);
            border-color: #667eea;
        }
        .product h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .price {
            color: #667eea;
            font-size: 1.5em;
            font-weight: bold;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
            font-size: 1em;
        }
        .btn:hover {
            background: #5568d3;
        }
        .info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            color: #6b7280;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ Online Store</h1>
        <span class="status">✓ Service Online</span>
        <p style="color: #6b7280; margin-top: 10px;">Welcome to our store! Browse our products below.</p>
        
        <div class="products">
            <div class="product">
                <h3>📱 Smartphone</h3>
                <p class="price">$599</p>
                <button class="btn">Add to Cart</button>
            </div>
            <div class="product">
                <h3>💻 Laptop</h3>
                <p class="price">$1,299</p>
                <button class="btn">Add to Cart</button>
            </div>
            <div class="product">
                <h3>🎧 Headphones</h3>
                <p class="price">$199</p>
                <button class="btn">Add to Cart</button>
            </div>
            <div class="product">
                <h3>⌚ Smartwatch</h3>
                <p class="price">$399</p>
                <button class="btn">Add to Cart</button>
            </div>
        </div>
        
        <div class="info">
            <strong>ℹ️ Note:</strong> This is a demonstration victim service. When under DDoS attack, this page will become slow or unavailable.
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    global request_count
    with request_lock:
        request_count += 1
        current_count = request_count
    
    if current_count > 50:
        time.sleep(0.5)
    if current_count > 100:
        time.sleep(1)
    if current_count > 200:
        time.sleep(2)
    
    return render_template_string(VICTIM_HTML)

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    global request_count
    with request_lock:
        request_count += 1
        current_count = request_count
    
    if current_count > 50:
        time.sleep(0.3)
    if current_count > 100:
        time.sleep(0.8)
    if current_count > 200:
        return jsonify({"error": "Service Unavailable"}), 503
    
    products = {
        1: {"name": "Smartphone", "price": 599},
        2: {"name": "Laptop", "price": 1299},
        3: {"name": "Headphones", "price": 199},
        4: {"name": "Smartwatch", "price": 399}
    }
    
    return jsonify(products.get(product_id, {"error": "Not found"}))

@app.route('/health')
def health():
    global request_count
    with request_lock:
        current_count = request_count
    
    if current_count > 200:
        status = "critical"
        response_code = 503
    elif current_count > 100:
        status = "degraded"
        response_code = 200
    elif current_count > 50:
        status = "warning"
        response_code = 200
    else:
        status = "healthy"
        response_code = 200
    
    return jsonify({
        "status": status,
        "active_requests": current_count,
        "message": f"Service is {status}"
    }), response_code

@app.route('/reset')
def reset():
    global request_count
    with request_lock:
        request_count = 0
    return jsonify({"message": "Request count reset", "status": "healthy"})

def decay_requests():
    global request_count
    while True:
        time.sleep(1)
        with request_lock:
            if request_count > 0:
                request_count = max(0, request_count - 10)

decay_thread = threading.Thread(target=decay_requests, daemon=True)
decay_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=False, threaded=True)
