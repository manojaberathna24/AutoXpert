# AutoXpert: Multimodal AI-Powered Vehicle Damage Detection, Structural Segmentation & Customer Sentiment Assessment System

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React Native](https://img.shields.io/badge/Mobile-React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![PyTorch](https://img.shields.io/badge/Framework-PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![YOLOv8](https://img.shields.io/badge/Object_Detection-YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black)](https://github.com/ultralytics/ultralytics)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

**AutoXpert** is an end-to-end, multi-tier artificial intelligence pipeline engineered to automate motor vehicle claim processing, structural damage inspection, and localized claim dispute analytics. 

Traditional automotive insurance adjustments rely heavily on subjective physical audits, leading to claim latency, human assessment discrepancies, and operational bottlenecks. AutoXpert combines transfer-learned deep convolutional neural networks, real-time object boundary regressors, semantic segmentation networks, and domain-adapted natural language processors into a single, unified client-server architecture:

1. **Global Body Damage Categorization:** EfficientNetV2 identifies macroscopic damage patterns across vehicle panels.
2. **Component & Damage Localization:** Custom YOLOv8 predicts discrete coordinate masks and bounding envelopes around dented, scratched, or fractured assemblies.
3. **Tread Depth & Wear Segmentation:** U-Net executes pixel-level semantic isolation of tire treads and localized surface abrasions to determine roadworthiness.
4. **Code-Mixed Sentiment Extraction:** A specialized NLP rule-engine with an expanded NLTK VADER lexicon interprets Sinhala-English (**Singlish**) dialectal phonetic text to quantify customer sentiment and claim urgency.

---

## 🏛️ System Architecture
