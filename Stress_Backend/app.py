import os
from flask import Flask, request, jsonify
import numpy as np
import librosa
import librosa.display
import pandas as pd
import keras
from flask_cors import CORS  # Add CORS support

# Set global input duration
input_duration = 3

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Ensure temp directory exists
os.makedirs("tmp_dir", exist_ok=True)

@app.route('/predict', methods=['POST'])
def predict_stress():
    try:
        # Check if a file was uploaded in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'})
            
        # Create a unique filename to avoid conflicts
        save_path = os.path.join("tmp_dir", "temp_audio.wav")
        file.save(save_path)
        
        # Check if the saved file exists
        if not os.path.exists(save_path):
            return jsonify({'error': 'File not saved properly'})
        
        # Log file size for debugging
        file_size = os.path.getsize(save_path)
        print(f"File saved at {save_path}, size: {file_size} bytes")
        
        # Process the audio and get prediction
        data = preprocess(save_path)
        
        # Check if data is valid
        if data is None or data.size == 0:
            return jsonify({'error': 'Audio preprocessing failed'})
            
        print(f"Preprocessed data shape: {data.shape}")
        
        # Load model
        try:
            model = keras.models.load_model('Model/model_last.h5')  # Fix path separator
        except Exception as model_error:
            return jsonify({'error': f'Failed to load model: {str(model_error)}'})
            
        # Get prediction
        prediction = model.predict(data)
        prediction = prediction.argmax(axis=1)
        prediction = prediction.astype(int).flatten()
        
        # Map prediction to label
        labels = ['negative', 'neutral', 'positive']
        prediction_label = labels[int(prediction[0])]  # Access first element safely
        
        # Clean up
        os.remove(save_path)
        
        # Return result
        return jsonify({'prediction': prediction_label})
        
    except FileNotFoundError as e:
        print(f"File not found error: {str(e)}")
        return jsonify({'error': f'File not found: {str(e)}'})
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)})

def preprocess(audio):
    try:
        # Use scipy resampling instead of kaiser_fast to avoid resampy dependency
        samples, sample_rate = librosa.load(
            audio, 
            res_type='scipy',  # Changed from 'kaiser_fast'
            duration=input_duration, 
            sr=22050*2,
            offset=0.5
        )
        
        # Rest of your code remains the same
        # ...
        
        # Trim the audio
        trimmed, index = librosa.effects.trim(samples, top_db=30)
        
        # Extract MFCC features
        mfccs = np.mean(librosa.feature.mfcc(y=trimmed, sr=sample_rate, n_mfcc=13), axis=0)
        
        # Create a DataFrame with the feature
        data = pd.DataFrame(columns=['feature'])
        data.loc[0] = [mfccs]
        data.loc[1] = [np.zeros((259,))]
        
        # Process the data for the model
        trimmed_df = pd.DataFrame(data['feature'].values.tolist())
        trimmed_df = trimmed_df.fillna(0)
        X_test = np.array(trimmed_df)
        x_testcnn = np.expand_dims(X_test, axis=2)
        
        # Remove the second row containing zeros
        new_array = np.delete(x_testcnn, 1, axis=0)
        
        print(f"Preprocessed audio shape: {new_array.shape}")
        return new_array
        
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)