Here’s a more attractive and polished version of your **Stress Analyzer** project README, with improved formatting, visuals, and style while preserving all your information:

---

# 📱 Stress Analyzer

**A mobile app that detects stress levels in speech using machine learning.**  
Combining a **Flask backend** for real-time audio inference and a sleek **React Native frontend**, Stress Analyzer delivers emotional insights right from your voice.



---

## 🚀 Features

- 🎙️ **Record Audio**: Capture voice directly from your device  
- 📁 **Upload Audio**: Choose existing audio files  
- 🔊 **Playback Controls**: Play audio with progress bar  
- 🧠 **Stress Analysis**: ML model classifies emotional tone  
- 📊 **Instant Results**: Displays as Negative, Neutral, or Positive

---

## 🧰 Tech Stack

### 🔗 Backend
- **Flask** — REST API with Python
- **Keras / TensorFlow** — Audio classification
- **Librosa** — Audio feature extraction
- **NumPy / Pandas** — Data processing
- **Flask-CORS** — Cross-origin support

### 📱 Frontend
- **React Native** — Cross-platform mobile app
- **Expo** — Simplified development & deployment
- **Expo Audio** — Recording and playback
- **Expo Document Picker** — File uploads

---

## ⚙️ Installation

### ✅ Prerequisites
- Node.js v14+
- Python 3.8+
- pip
- Expo CLI:  
  ```bash
  npm install -g expo-cli
  ```

---

### 🧪 Backend Setup

```bash
git clone https://github.com/yourusername/stress-analyzer.git
cd stress-analyzer/backend
```

1. **Create virtual environment**  
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**  
   ```bash
   pip install flask numpy pandas librosa keras tensorflow flask-cors
   ```

3. **Model setup**  
   - Create a `Model/` directory
   - Add your trained model file `model_last.h5` inside

4. **Start the Flask server**  
   ```bash
   python app.py
   ```
   Runs at `http://0.0.0.0:5000`

---

### 📱 Frontend Setup

```bash
cd ../frontend
```

1. **Install packages**  
   ```bash
   npm install
   ```

2. **Update server URL**  
   - In `App.js`, set your Flask IP in `serverUrl`

3. **Launch app**  
   ```bash
   npx expo start
   ```

4. **Run on your device**  
   - Scan QR with [Expo Go](https://expo.dev/client)
   - Or use emulator (`a` for Android / `i` for iOS)

---

## 📲 How to Use

1. Open the app  
2. Record or upload an audio file  
3. Tap ▶️ to preview  
4. Hit **Analyze Audio**  
5. See the result: 🟢 Positive / 🟡 Neutral / 🔴 Negative

---

## 📁 Project Structure

```
stress-analyzer/
├── backend/
│   ├── app.py
│   ├── Model/
│   │   └── model_last.h5
│   └── tmp_dir/
├── frontend/
│   ├── App.js
│   ├── SplashScreen.js
│   ├── app.json
│   └── package.json
└── README.md
```

---

## 🔌 API Reference

### `POST /predict`

- **Description**: Analyze audio for stress
- **Request**: `multipart/form-data` with an audio file
- **Response**: JSON result
```json
{
  "prediction": "positive"  // or "negative", "neutral"
}
```

---

## 🤝 Contributing

1. Fork the repo  
2. Create a new branch  
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes  
4. Push and open a PR ✅

---

## 📜 License

This project is licensed under the **MIT License**.  
See the `LICENSE` file for full details.

---

## 🙌 Acknowledgements

- [Librosa](https://librosa.org/) for audio analysis  
- [Keras](https://keras.io/) for machine learning  
- [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) for mobile dev

---

Let me know if you'd like to turn this into a **GitHub README.md** file or add badges, animated demos, or contribution guidelines!
