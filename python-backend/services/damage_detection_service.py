import os
import datetime
import numpy as np
import tensorflow as tf
from PIL import Image
from torchvision import transforms
from ultralytics import YOLO

# Compute paths
_BASE_DIR = os.path.dirname(__file__)
_YOLO_PATH = os.path.join(_BASE_DIR, '..', 'models', 'best.pt')
_EFFICIENTNET_PATH = os.path.join(_BASE_DIR, '..', 'models', 'EfficientNetV2_DamageDetection.h5')

# Load both models once at module import
print("Loading YOLOv8 model…")
_MODEL_YOLO = YOLO(_YOLO_PATH)

print("Loading EfficientNetV2 model…")
try:
    _MODEL_EFFICIENTNET = tf.keras.models.load_model(_EFFICIENTNET_PATH)
except Exception as e:
    print(f"Failed to load EfficientNetV2 model: {e}")
    _MODEL_EFFICIENTNET = None

print("Models loaded successfully")

class DamageDetectionService:
    def __init__(self):
        # Just reference the pre-loaded models
        self.model_yolo = _MODEL_YOLO
        self.efficientnet_model = _MODEL_EFFICIENTNET

    def predict_damage_and_repairability(self, image_file):
        temp_path = "temp_image.jpg"
        try:
            image_file.save(temp_path)

            damage_type    = self._predict_damage_type(temp_path)
            repairability  = self._predict_repairability(temp_path)

            return {
                'damage_type': damage_type,
                'repairability': repairability
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'damage_type': 'Unknown',
                'repairability': 'Unknown'
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _predict_damage_type(self, image_path):
        try:
            img = Image.open(image_path)
            batch = self._preprocess_image_for_efficientnet(img)
            pred  = self.efficientnet_model.predict(batch)
            return 'Dent' if pred[0][0] > 0.5 else 'Scratch'
        except Exception as e:
            print(f"Damage type prediction error: {e}")
            return 'Unknown'

    def _predict_repairability(self, image_path):
        try:
            img    = Image.open(image_path)
            batch  = self._preprocess_image_for_yolo(img)
            results = self.model_yolo(batch)[0]
            
            # --- Viva Debug: Save original image with boxes ---
            os.makedirs("detections", exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join("detections", f"detected_{timestamp}.jpg")
            results.save(filename=output_path) 
            # ------------------------------------------------
            
            boxes   = results.boxes
            repairable = any(box.conf[0] > 0.5 for box in boxes)
            return 'Repairable' if repairable else 'Unrepairable'
        except Exception as e:
            print(f"Repairability prediction error: {e}")
            return 'Unknown'

    @staticmethod
    def _preprocess_image_for_yolo(image):
        return transforms.Compose([
            transforms.Resize((640, 640)),
            transforms.ToTensor(),
        ])(image).unsqueeze(0)

    @staticmethod
    def _preprocess_image_for_efficientnet(image):
        image = image.resize((128, 128))
        arr   = np.array(image) / 255.0
        return np.expand_dims(arr, axis=0)
