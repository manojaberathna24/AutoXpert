from flask import Blueprint, request, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

# Create a Blueprint for store-related routes
store_bp = Blueprint('store', __name__)

# Helper function to log messages to the database
def log_to_db(level, message, user_email=None, endpoint=None):
    """
    Logs a message to the 'logs' table in the database.
    """
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO logs (level, message, user_email, endpoint)
                     VALUES (?, ?, ?, ?)''',
                  (level, message, user_email, endpoint))
        conn.commit()
    except sqlite3.Error as e:
        print(f"Error logging to database: {e}")
    finally:
        conn.close()

@store_bp.route('/login', methods=['POST'])
def login():
    """
    Logs in a store owner.
    """
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id, store_name, password FROM stores WHERE LOWER(email) = LOWER(?)', (email,))
        store = c.fetchone()
        conn.close()

        if store and check_password_hash(store[2], password):
             log_to_db('INFO', 'Login successful', email, '/login')
             return jsonify({
                 'message': 'Login successful',
                 'store_id': store[0],
                 'store_name': store[1]
             }), 200
        else:
            log_to_db('ERROR', 'Invalid credentials', email, '/login')
            return jsonify({'message': 'Invalid email or password'}), 401
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', email, '/login')
        return jsonify({'message': 'Login failed'}), 500

@store_bp.route('/register', methods=['POST'])
def register_store():
    """
    Registers a new store by saving its details to the database.
    """
    data = request.json
    email = data.get('email')
    print(f"DEBUG: Registration request received for email: {email}")
    store_name = data.get('store_name')
    store_type = data.get('store_type')
    store_description = data.get('store_description')
    contact_number = data.get('contact_number')
    email = data.get('email')
    password = data.get('password')
    latitude = data.get('latitude', 6.9271)
    longitude = data.get('longitude', 79.8612)
    mapslink = data.get('mapslink', '')
    location_id = data.get('location_id', 'L1')

    if not all([store_name, store_type, contact_number, email, password]):
        log_to_db('ERROR', 'Missing required fields', email, '/register')
        return jsonify({'message': 'All fields are required'}), 400

    hashed_password = generate_password_hash(password)
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO stores 
                     (store_name, store_type, store_description, contact_number, email, password, latitude, longitude, mapslink, location_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (store_name, store_type, store_description, contact_number, email, hashed_password, latitude, longitude, mapslink, location_id))
        conn.commit()
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', email, '/register')
        return jsonify({'message': 'Failed to register store'}), 500
    finally:
        conn.close()

    log_to_db('INFO', 'Store registered successfully', email, '/register')
    return jsonify({'message': 'Store registered successfully'}), 201

@store_bp.route('/store/<int:store_id>/update-location', methods=['POST'])
def update_store_location(store_id):
    data = request.json
    location_id = data.get('location_id')
    if not location_id:
        return jsonify({'message': 'Location ID is required'}), 400
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('UPDATE stores SET location_id = ? WHERE id = ?', (location_id, store_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Location updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/store/<int:store_id>/add-product', methods=['POST'])
def add_product(store_id):
    """
    Adds a new product to a store.
    """
    data = request.json
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock', False)

    if not all([name, price]):
        log_to_db('ERROR', 'Missing required fields', endpoint='/store/add-product')
        return jsonify({'message': 'Name and price are required'}), 400

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id FROM stores WHERE id = ?', (store_id,))
        store = c.fetchone()
        if not store:
            log_to_db('ERROR', f'Store with ID {store_id} does not exist', endpoint='/store/add-product')
            return jsonify({'message': 'Store not found'}), 404

        c.execute('''INSERT INTO products 
                     (store_id, name, price, stock, image_path)
                     VALUES (?, ?, ?, ?, ?)''',
                  (store_id, name, price, stock, data.get('image_path', '')))
        conn.commit()
        product_id = c.lastrowid
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', endpoint='/store/add-product')
        return jsonify({'message': 'Failed to add product'}), 500
    finally:
        conn.close()

    log_to_db('INFO', 'Product added successfully', endpoint='/store/add-product')
    return jsonify({
        'id': product_id,
        'store_id': store_id,
        'name': name,
        'price': price,
        'stock': stock,
    }), 201