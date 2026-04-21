import os
import sys
import sqlite3
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import db
from Config import Config
from routes.store_routes import store_bp
from helper import get_sentiment
from controllers.damage_detection_controller import damage_detection
from controllers.tire_segmentation_controller import tire_segmentation
from controllers.vehicle_classification_controller import vehicle_classification
from datetime import datetime

sys.path.append(os.path.abspath(os.path.dirname(__file__)))


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize DB and CORS
    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(store_bp, url_prefix='/api')
    app.register_blueprint(damage_detection, url_prefix='/damage_detection')
    app.register_blueprint(tire_segmentation, url_prefix='/tire_segmentation')
    app.register_blueprint(vehicle_classification, url_prefix='/vehicle_classification')

    # Sentiment analysis variables
    app.config["reviews"] = []
    app.config["positive"] = 0
    app.config["negative"] = 0
    
    @app.route('/')
    def index():
        return jsonify({"status": "Backend is Online", "message": "AutoXpert API is running"}), 200

    # Initialize all necessary tables in SQLite
    def init_db():
        with app.app_context():
            conn = sqlite3.connect('stores.db')
            c = conn.cursor()
            # Stores table
            c.execute('''CREATE TABLE IF NOT EXISTS stores
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          store_name TEXT NOT NULL,
                          store_type TEXT NOT NULL,
                          store_description TEXT,
                          contact_number TEXT NOT NULL,
                          email TEXT NOT NULL,
                          password TEXT NOT NULL,
                          latitude REAL NOT NULL,
                          longitude REAL NOT NULL)''')

            # Logs table
            c.execute('''CREATE TABLE IF NOT EXISTS logs
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                          level TEXT NOT NULL,
                          message TEXT NOT NULL,
                          user_email TEXT,
                          endpoint TEXT NOT NULL)''')

            # Products table
            c.execute('''CREATE TABLE IF NOT EXISTS products
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          store_id INTEGER NOT NULL,
                          name TEXT NOT NULL,
                          price REAL NOT NULL,
                          stock BOOLEAN NOT NULL,
                          FOREIGN KEY (store_id) REFERENCES stores (id))''')

            # Vehicle repair costs table
            c.execute('''CREATE TABLE IF NOT EXISTS repair_costs
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          vehicle TEXT NOT NULL,
                          part TEXT NOT NULL,
                          new_price_low INTEGER NOT NULL,
                          new_price_high INTEGER NOT NULL,
                          repair_value_low INTEGER NOT NULL,
                          repair_value_high INTEGER NOT NULL,
                          UNIQUE(vehicle, part))''')

            # Damage reports table
            c.execute('''CREATE TABLE IF NOT EXISTS damage_reports
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          vehicle TEXT NOT NULL,
                          body_type TEXT NOT NULL,
                          damage_type TEXT NOT NULL,
                          repairability TEXT NOT NULL,
                          repair_cost INTEGER NOT NULL,
                          image_path TEXT,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

            # Feedback table
            c.execute('''CREATE TABLE IF NOT EXISTS feedback
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          store_id INTEGER,
                          user_email TEXT,
                          comment TEXT NOT NULL,
                          rating INTEGER,
                          sentiment TEXT,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (store_id) REFERENCES stores (id))''')

            conn.commit()
            conn.close()

    init_db()

    # Logging function
    # ... (log_to_db remains same) ...

    # ... (register_store, login remain same) ...

    # Get store details
    @app.route('/store/<int:store_id>', methods=['GET'])
    def get_store(store_id):
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT * FROM stores WHERE id = ?', (store_id,))
        store = c.fetchone()
        
        # Fetch products
        c.execute('SELECT * FROM products WHERE store_id = ?', (store_id,))
        products_rows = c.fetchall()
        products = [{'id': r[0], 'name': r[2], 'price': r[3], 'stock': bool(r[4])} for r in products_rows]

        # Fetch feedback
        c.execute('SELECT user_email, comment, sentiment, rating FROM feedback WHERE store_id = ? ORDER BY created_at DESC', (store_id,))
        feedback_rows = c.fetchall()
        feedback = [{'user': r[0] or 'Anonymous', 'comment': r[1], 'sentiment': r[2], 'rating': r[3]} for r in feedback_rows]
        
        # Calculate dynamic rating
        ratings = [r[3] for r in feedback_rows if r[3] is not None and r[3] > 0]
        average_rating = sum(ratings) / len(ratings) if ratings else 0.0
        # Round to 1 decimal place
        average_rating = round(average_rating, 1)

        conn.close()

        if store:
            return jsonify({
                'id': store[0],
                'name': store[1], 
                'location': f"Lat: {store[7]}, Lon: {store[8]}",
                'contact': store[4],
                'rating': average_rating, 
                'products': products,
                'feedback': feedback
            }), 200
        else:
            return jsonify({'message': 'Store not found'}), 404

    # ... (add_product remains same) ...

    # Sentiment analysis & Feedback Submission endpoint
    @app.route('/predict', methods=['POST'])
    def predict():
        data = request.json
        text = data.get("text", "").strip()
        store_id = data.get("store_id")
        rating = data.get("rating", 0) # User rating 1-5
        user_email = data.get("user_email", "Anonymous")

        print(f"DEBUG: Predict called. Store: {store_id}, Rating: {rating}, Text: '{text}'")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Simplified prediction using new helper without model complexity
        prediction = get_sentiment(text)

        # Save to DB if store_id is present
        if store_id:
            try:
                conn = sqlite3.connect('stores.db')
                c = conn.cursor()
                c.execute('''INSERT INTO feedback (store_id, user_email, comment, rating, sentiment)
                             VALUES (?, ?, ?, ?, ?)''',
                          (store_id, user_email, text, rating, prediction))
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"Error saving feedback: {e}")

        if prediction == "negative":
            app.config["negative"] += 1
        else:
            app.config["positive"] += 1

        app.config["reviews"].insert(0, {"text": text, "prediction": prediction})

        return jsonify({
            "prediction": prediction,
            "positive_count": app.config["positive"],
            "negative_count": app.config["negative"],
            "recent_reviews": app.config["reviews"][:5]
        })

    # Log messages endpoint
    @app.route('/log', methods=['POST'])
    def log():
        data = request.json
        level = data.get('level')
        message = data.get('message')
        user_email = data.get('user_email')
        endpoint = data.get('endpoint')

        if not all([level, message, endpoint]):
            return jsonify({'message': 'Missing required fields'}), 400

        log_to_db(level, message, user_email, endpoint)
        return jsonify({'message': 'Log recorded successfully'}), 201



    # Damage detection upload endpoint
    @app.route('/damage_detection/upload', methods=['POST'])
    def upload_image():
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400

        try:
            image = request.files['image']
            vehicle = request.form.get('vehicle')
            body_type = request.form.get('body_type')

            if not vehicle or not body_type:
                return jsonify({"error": "Missing vehicle or body type"}), 400

            prediction = damage_detection.DamageDetectionService().predict_damage_and_repairability(image)
            damage_type = prediction.get('damage_type', 'Unknown')
            repairability = prediction.get('repairability', 'Unknown')

            conn = sqlite3.connect('stores.db')
            c = conn.cursor()
            c.execute('''SELECT new_price_low, new_price_high, repair_value_low, repair_value_high
                         FROM repair_costs
                         WHERE vehicle = ? AND part = ?''',
                      (vehicle, body_type))
            price_data = c.fetchone()
            conn.close()

            if not price_data:
                fallback_new_price_range = "Rs. 35,000 - 60,000"
                fallback_repair_cost = "Rs. 8,000 - 15,000"

                return jsonify({
                    "status": "error",
                    "error": "No price data for this vehicle and part",
                    "fallback_data": {
                        "vehicle": vehicle,
                        "body_type": body_type,
                        "damage_type": damage_type,
                        "repairability": repairability,
                        "new_price_range": fallback_new_price_range,
                        "repair_cost_range": fallback_repair_cost,
                        "repair_cost_low": fallback_repair_cost,
                        "repair_cost_high": fallback_repair_cost
                    }
                }), 200

            new_price_low, new_price_high, repair_low, repair_high = price_data

            repair_cost_str = repair_low if repairability == "Repairable" else repair_high

            return jsonify({
                "status": "success",
                "vehicle": vehicle,
                "body_type": body_type,
                "damage_type": damage_type,
                "repairability": repairability,
                "new_price_range_low": new_price_low,
                "new_price_range_high": new_price_high,
                "repair_cost": repair_cost_str
            })

        except Exception as e:
            return jsonify({"status": "error", "error": str(e)}), 500

    # Get damage reports endpoint
    @app.route('/damage_reports', methods=['GET'])
    def get_damage_reports():
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT * FROM damage_reports ORDER BY created_at DESC LIMIT 50')
        reports = c.fetchall()
        conn.close()

        report_list = []
        for report in reports:
            report_list.append({
                "id": report[0],
                "vehicle": report[1],
                "body_type": report[2],
                "damage_type": report[3],
                "repairability": report[4],
                "repair_cost": report[5],
                "created_at": report[7]
            })

        return jsonify(report_list)

    # Get shop locations endpoint
    @app.route('/shop_locations', methods=['GET'])
    def get_locations():
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT DISTINCT location_id, location_name FROM shop_locations')
        rows = c.fetchall()
        conn.close()
        locations = [{"id": loc_id, "name": loc_name} for loc_id, loc_name in rows]
        return jsonify(locations)

    # Get repair shops for a location or search
    @app.route('/repair_shops', methods=['GET'])
    def get_repair_shops():
        location_id = request.args.get('location_id')
        user_lat = request.args.get('lat')
        user_lng = request.args.get('lng')
        search_query = request.args.get('search')

        def haversine(lat1, lon1, lat2, lon2):
            if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
                return None
            R = 6371
            dLat = math.radians(float(lat2) - float(lat1))
            dLon = math.radians(float(lon2) - float(lon1))
            a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
                math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * \
                math.sin(dLon / 2) * math.sin(dLon / 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        
        # Base query: Merge pre-seeded shops and newly registered stores
        query = """
            SELECT 0 as rank, shop_name, address, phone, mapslink, latitude, longitude, location_name 
            FROM shop_locations 
            WHERE 1=1
            """
        params = []
        
        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
            
        if search_query:
            query += " AND (shop_name LIKE ? OR location_name LIKE ? OR address LIKE ?)"
            s = f"%{search_query}%"
            params.extend([s, s, s])

        # Add Union with registered 'stores' table
        query += """
            UNION ALL
            SELECT 0 as rank, store_name as shop_name, 'Registered Store' as address, contact_number as phone, mapslink, latitude, longitude, 
            CASE 
                WHEN location_id = 'L1' THEN 'Colombo'
                WHEN location_id = 'L2' THEN 'Kandy'
                WHEN location_id = 'L3' THEN 'Galle'
                WHEN location_id = 'L4' THEN 'Gampaha'
                ELSE location_id 
            END as location_name
            FROM stores
            WHERE 1=1
        """
        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
            
        if search_query:
            query += " AND (store_name LIKE ? OR location_id LIKE ?)"
            s = f"%{search_query}%"
            params.extend([s, s])

        c.execute(query, params)
        rows = c.fetchall()
        
        shops = []
        for r, name, addr, phone, link, lat, lng, loc_name in rows:
            dist = haversine(user_lat, user_lng, lat, lng) if user_lat and user_lng else None
            
            # --- Unified Rating Logic ---
            # 1. Check pre-seeded feedback
            c.execute('SELECT sentiment FROM shop_feedback WHERE shop_name = ?', (name,))
            pre_feedbacks = c.fetchall()
            
            # 2. Check registered store feedback (using name match for discovery list)
            c.execute('SELECT sentiment, rating FROM feedback WHERE store_id IN (SELECT id FROM stores WHERE store_name = ?)', (name,))
            reg_feedbacks = c.fetchall()
            
            # Combine all feedback
            all_sentiments = [f[0] for f in pre_feedbacks] + [f[0] for f in reg_feedbacks]
            all_ratings = [f[1] for f in reg_feedbacks if f[1] is not None]
            
            if all_ratings:
                stars = round(sum(all_ratings) / len(all_ratings), 1)
            elif all_sentiments:
                pos = sum(1 for s in all_sentiments if s == 'positive')
                stars = round((pos / len(all_sentiments) * 5), 1)
            else:
                stars = 4.0 # Default starting rating
            
            shops.append({
                "rank": r,
                "shopName": name,
                "address": addr,
                "phone": phone,
                "mapslink": link,
                "latitude": lat,
                "longitude": lng,
                "distance": round(dist, 1) if dist is not None else None,
                "rating": stars,
                "location_name": loc_name
            })
            
        conn.close()

        if user_lat and user_lng:
            shops.sort(key=lambda x: x['distance'] if x['distance'] is not None else 999)

        return jsonify(shops)

    # Vehicle price trends endpoint
    @app.route('/vehicle_price_trends', methods=['GET'])
    def vehicle_price_trends():
        vehicle_type = request.args.get('vehicle_type')
        model_year = request.args.get('model_year')

        print(f"Received vehicle_type: {vehicle_type}, model_year: {model_year}")

        if not vehicle_type or not model_year:
            return jsonify({'status': 'error', 'message': 'Missing vehicle_type or model_year parameter'}), 400

        if vehicle_type.startswith("Toyota_"):
            vehicle_type = vehicle_type.replace("Toyota_", "")

        conn = sqlite3.connect('stores.db')
        cursor = conn.cursor()

        query = '''
            SELECT year_2020, year_2021, year_2022, year_2023, year_2024
            FROM vehicle_market_analysis
            WHERE vehicle_type = ? AND model_year = ?
        '''
        cursor.execute(query, (vehicle_type, int(model_year)))
        row = cursor.fetchone()
        conn.close()

        if not row:
            print(f"No data found for vehicle_type={vehicle_type} and model_year={model_year}")
            return jsonify({'status': 'error', 'message': 'No data found for given parameters'}), 404

        data = {
            '2020': row[0],
            '2021': row[1],
            '2022': row[2],
            '2023': row[3],
            '2024': row[4],
        }

        return jsonify({'status': 'success', 'data': data})

    return app


if __name__ == '__main__':
    print("Initializing application...")
    app = create_app()
    print("Application created.")
    with app.app_context():
        db.create_all()
    print("Database initialized.")
    print("Starting Flask server on port 8080...")
    app.run(host="0.0.0.0", port=8080, debug=False)
    print("Flask server exited.")
