# MAJOR CODE SEGMENTS

The essential features of the AutoXpert system are demonstrated in the following code portions. These solutions adhere to security best practices and preserve readability while showcasing the essential functionality.

## 1. Authentication Middleware (Store Login)
The authentication logic verifies store owner credentials using secure password hashing.

```python
# python-backend/routes/store_routes.py

@store_bp.route('/login', methods=['POST'])
def login():
    """
    Logs in a store owner.
    """
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id, store_name, password FROM stores WHERE email = ?', (email,))
        store = c.fetchone()
        conn.close()

        if store and check_password_hash(store[2], password):
             return jsonify({
                 'message': 'Login successful',
                 'store_id': store[0],
                 'store_name': store[1]
             }), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401
    except sqlite3.Error as e:
        return jsonify({'message': 'Login failed'}), 500
```

## 2. Damage Detection Integration
The damage detection service integrates with the machine learning models (EfficientNet + YOLO) to analyze car damage images.

```python
# python-backend/services/damage_detection_service.py

class DamageDetectionService:
    def predict_damage_and_repairability(self, image_file):
        try:
            # Step 1: Damage Type Prediction (EfficientNet)
            batch = self._preprocess_image_for_efficientnet(img)
            t_pred = self.efficientnet_model.predict(batch)
            damage_type = 'Dent' if t_pred[0][0] > 0.5 else 'Scratch'

            # Step 2: Repairability Assessment (YOLOv8)
            batch_yolo = self._preprocess_image_for_yolo(img)
            results = self.model_yolo(batch_yolo)[0]
            
            is_repairable = any(box.conf[0] > 0.5 for box in results.boxes)
            
            return {
                'damage_type': damage_type,
                'repairability': 'Repairable' if is_repairable else 'Replace'
            }
        except Exception as e:
            return {'damage_type': 'Unknown', 'repairability': 'Unknown'}
```

## 3. Tire Depth Calculation Logic
This module implements the mathematical conversion from a segmentation mask to a physical tread depth measurement.

```python
# python-backend/services/tire_segmentation_service.py

def _calculate_predicted_depth(mask):
    """
    Converts the Neural Network's segmentation mask into a 
    real-world millimeter measurement.
    """
    # 1. Calculate the density of the tire grooves (Normalized 0-1)
    groove_density = np.sum(mask) / (256 * 256)

    # 2. Linear Interpolation (Mapping density to physical depth)
    MIN_DEPTH_MM = 1.59  # Legal limit (Bald tire)
    MAX_DEPTH_MM = 8.73  # Factory new tire

    # 3. Calculate actual depth
    real_depth_mm = MIN_DEPTH_MM + (groove_density * (MAX_DEPTH_MM - MIN_DEPTH_MM))

    return real_depth_mm
```

## 4. Singlish/Local Sentiment Analysis Engine
The helper module extends the VADER lexicon to support local vernacular ("Singlish").

```python
# python-backend/helper.py

# Custom Lexicon for Sri Lankan Context
singlish_updates = {
    'awl': -2.0,       # Meaning: "Service is bad"
    'cha': -2.5,       # Meaning: "Very poor quality"
    'supiri': 3.0,     # Meaning: "Superb"
    'patta': 3.0       # Meaning: "Great/Awesome"
}

# Injecting the terms into the VADER engine
sid.lexicon.update(singlish_updates)

def get_sentiment(text):
    # Analyzing text using the hybrid (English + Singlish) dictionary
    scores = sid.polarity_scores(text)
    return 'negative' if scores['compound'] < 0 else 'positive'
```

## 5. Store Registration Logic
The registration implementation handles data validation, password hashing, and database insertion for new store profiles.

```python
# python-backend/routes/store_routes.py

@store_bp.route('/register', methods=['POST'])
def register_store():
    data = request.json
    hashed_password = generate_password_hash(data.get('password'))
    
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO stores 
                     (store_name, store_type, email, password, latitude, longitude)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (data.get('store_name'), data.get('store_type'), data.get('email'), 
                   hashed_password, data.get('latitude'), data.get('longitude')))
        conn.commit()
    finally:
        conn.close()

    return jsonify({'message': 'Store registered successfully'}), 201
```

## 6. Frontend Image Upload Implementation
The image upload component demonstrates how the frontend converts files to FormData for API transmission.

```typescript
// frontend/app/feedback/StoreRegistraion.tsx

const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);

    try {
      const response = await fetch(`${BASE_URL}/damage_detection/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to analyze image.');
    }
};
```

## 7. Manual Location Fallback System
This frontend logic ensures users can register their shop location even if the Google Maps API fails.

```typescript
// frontend/app/feedback/StoreRegistraion.tsx

{/* Manual Fallback UI */}
<View style={styles.coordInputGroup}>
  <View style={{ flex: 1 }}>
    <Text style={styles.miniLabel}>Latitude</Text>
    <TextInput
      style={styles.coordInput}
      keyboardType="numeric"
      value={location?.latitude?.toString()}
      onChangeText={(val) => setLocation(prev => ({
        ...prev, latitude: parseFloat(val) || 0
      }))}
    />
  </View>
  {/* Map Component Integration */}
  <MapPicker location={location} onLocationSelect={setLocation} />
</View>
```

## 8. Database Initialization
The application initializes the SQLite database schema automatically on startup if tables do not exist.

```python
# python-backend/app.py

def init_db():
    with app.app_context():
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        
        # Feedback table with Sentiment support
        c.execute('''CREATE TABLE IF NOT EXISTS feedback
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      store_id INTEGER,
                      comment TEXT NOT NULL,
                      rating INTEGER,
                      sentiment TEXT,
                      FOREIGN KEY (store_id) REFERENCES stores (id))''')
        
        conn.commit()
        conn.close()
```

## 9. Market Prediction Feature Extraction
The service logic that maps categorical vehicle data (e.g., "Toyota Prius") into numerical features for the Random Forest model.

```python
# python-backend/services/vehicle_classification_service.py

@classmethod
def predict_price(cls, features: dict):
    brand_map = { "Toyota_Prius": "Prius", "Toyota_Axio": "Axio" }
    
    # Constructing the feature vector expected by the Regressor
    input_data = {
        'Brand': brand_map.get(features.get('car_type')),
        'Year': features.get('year', 0),
        'Mileage': features.get('mileage', ''),
        'Color': features.get('color', '')
    }

    input_df = pd.DataFrame([input_data])
    return _PRICE_MODEL.predict(input_df)[0]
```

## 10. Feedback Submission API
The Flask endpoint that accepts user reviews and triggers the Singlish Sentiment Analysis.

```python
# python-backend/app.py

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get("text", "")
    store_id = data.get("store_id")

    # Real-time Sentiment Analysis
    prediction = get_sentiment(text)

    # Persisting Feedback
    if store_id:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('INSERT INTO feedback (store_id, comment, sentiment) VALUES (?, ?, ?)',
                  (store_id, text, prediction))
        conn.commit()

    return jsonify({ "prediction": prediction })
```

## 11. Damage Assessment Result Display
This frontend component renders the comprehensive damage report, including the AI-predicted damage type and the retrieved estimated repair costs.

```typescript
// frontend/app/damage_detection/result.tsx

export default function DamageResult() {
  const { 
    vehicle, bodyType, damageType, repairability,
    newPriceRange, repairCostRange 
  } = useLocalSearchParams();  

  return (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing Information</Text>
        <View style={styles.row}>
            <Text style={styles.label}>Brand New Part Price:</Text>
            <Text style={styles.priceValue}>{newPriceRange}</Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>Estimated Repair Cost:</Text>
            <Text style={styles.priceValue}>{repairCostRange}</Text>
        </View>
        <Button 
          title="Find Repair Shops"
          onPress={() => router.push('/damage_detection/find_repair_shops')}
        />
    </View>
  );
}
```

## 12. Repair Cost Lookup Logic
This backend controller logic queries the database for specific repair costs based on the vehicle model and damaged body part detected by the AI.

```python
# python-backend/controllers/damage_detection_controller.py

@damage_detection.route('/upload', methods=['POST'])
def upload_image():
    # ... AI Prediction ...
    vehicle = request.form.get('vehicle')
    body_type = request.form.get('body_type')

    # Fetching specific market rates for the damaged part
    conn = sqlite3.connect('stores.db')
    c = conn.cursor()
    c.execute('''
        SELECT new_price_range, repair_value_low, repair_value_high
        FROM repair_costs
        WHERE vehicle = ? AND part = ?
    ''', (vehicle, body_type))
    price_data = c.fetchone()
    
    # ... Formatting response with price ranges ...
    return jsonify({
        "status": "success",
        "repair_cost_range": repair_low if repairability == "Repairable" else repair_high
    })
```

## 13. Vehicle Classification Upload Handler
The controller handles secure file upload and orchestrates the vehicle classification service.

```python
# python-backend/controllers/vehicle_classification_controller.py

@vehicle_classification.route('/upload', methods=['POST'])
def upload_vehicle_image():
    image = request.files['image']
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)

        # Service call for MobileNetV2 inference
        vehicle_type = vehicle_classification_service.classify_vehicle(image_path)

        return jsonify({
            "vehicle_type": vehicle_type,
            "image_path": image_path
        })
```

## 14. Repair Shop Recommendation Engine
This endpoint retrieves recommended repair shops based on location rank, facilitating the user's next step after damage detection.

```python
# python-backend/app.py

@app.route('/repair_shops', methods=['GET'])
def get_repair_shops():
    location_id = request.args.get('location_id')
    
    conn = sqlite3.connect('stores.db')
    c = conn.cursor()
    c.execute('''SELECT rank, shop_name, address, phone, mapslink
                 FROM shop_locations 
                 WHERE location_id = ? 
                 ORDER BY rank''',
              (location_id,))
    
    shops = [{
        "rank": r,
        "name": name,
        "mapslink": link
    } for r, name, _, _, link in c.fetchall()]

    return jsonify(shops)
```

## 15. Historical Market Price Trends
A specialized endpoint that fetches 5-year historical price data for specific vehicle models to generate market trend graphs.

```python
# python-backend/app.py

@app.route('/vehicle_price_trends', methods=['GET'])
def vehicle_price_trends():
    vehicle_type = request.args.get('vehicle_type')
    model_year = request.args.get('model_year')

    conn = sqlite3.connect('stores.db')
    cursor = conn.cursor()

    # Querying year-over-year price columns
    query = '''
        SELECT year_2020, year_2021, year_2022, year_2023, year_2024
        FROM vehicle_market_analysis
        WHERE vehicle_type = ? AND model_year = ?
    '''
    cursor.execute(query, (vehicle_type, int(model_year)))
    row = cursor.fetchone()

    data = {
        '2020': row[0], '2021': row[1], '2022': row[2],
        '2023': row[3], '2024': row[4]
    }
    return jsonify({'status': 'success', 'data': data})
```
