from flask import Flask, request, render_template
import numpy as np
from PIL import Image
import tensorflow as tf
import io

app = Flask(__name__)

# Load the pre-trained ML model
model = tf.keras.models.load_model('models/upi_verifier_model.h5')

def preprocess_image(image):
    """Preprocess the image for the model."""
    image = image.resize((224, 224))  # Resize to match model input size image = np.array(image) / 255.0  # Normalize pixel values
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify', methods=['POST'])
def verify():
    if 'file' not in request.files:
        return render_template('index.html', result={'error': 'No file uploaded'})

    file = request.files['file']
    image = Image.open(file.stream)
    processed_image = preprocess_image(image)

    # Make prediction
    prediction = model.predict(processed_image)
    is_fake = prediction[0][0] > 0.5  # Assuming binary classification

    return render_template('index.html', result={'is_fake': is_fake})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)