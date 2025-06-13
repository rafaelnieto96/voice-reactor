import os
import base64
import traceback
import logging
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ElevenLabs API Configuration
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

if not ELEVENLABS_API_KEY:
    print("ERROR: Missing ELEVENLABS_API_KEY environment variable")

# Available voices with their IDs (these are real ElevenLabs voice IDs)
AVAILABLE_VOICES = {
    'rachel': {'id': '21m00Tcm4TlvDq8ikWAM', 'name': 'Rachel (Female)', 'gender': 'female'},
    'drew': {'id': '29vD33N1CtxCmqQRPOHJ', 'name': 'Drew (Male)', 'gender': 'male'},
    'clyde': {'id': '2EiwWnXFnvU5JabPnv8n', 'name': 'Clyde (Male)', 'gender': 'male'},
    'paul': {'id': '5Q0t7uMcjvnagumLfvZi', 'name': 'Paul (Male)', 'gender': 'male'},
    'domi': {'id': 'AZnzlk1XvdvUeBnXmlld', 'name': 'Domi (Female)', 'gender': 'female'},
    'dave': {'id': 'CYw3kZ02Hs0563khs1Fj', 'name': 'Dave (Male)', 'gender': 'male'},
    'fin': {'id': 'D38z5RcWu1voky8WS1ja', 'name': 'Fin (Male)', 'gender': 'male'},
    'sarah': {'id': 'EXAVITQu4vr4xnSDxMaL', 'name': 'Sarah (Female)', 'gender': 'female'},
    'antoni': {'id': 'ErXwobaYiN019PkySvjV', 'name': 'Antoni (Male)', 'gender': 'male'},
    'thomas': {'id': 'GBv7mTt0atIp3Br8iCZE', 'name': 'Thomas (Male)', 'gender': 'male'},
}

@app.route('/')
def index():
    return render_template('index.html', voices=AVAILABLE_VOICES)

@app.route('/generate', methods=['POST'])
def generate_audio():
    try:
        # Get and validate request data
        data = request.json
        if not data:
            return jsonify({'error': 'Please provide valid data'}), 400

        text = data.get('text', '').strip()
        voice_id = data.get('voice', 'rachel').strip()
        speed = data.get('speed', 1.0)
        clarity = data.get('clarity', 0.75)

        # Validate input values
        if not text:
            return jsonify({'error': 'Please enter some text to convert to speech'}), 400

        if len(text) > 2500:
            return jsonify({'error': 'Text is too long. Maximum 2500 characters allowed'}), 400

        if voice_id not in AVAILABLE_VOICES:
            voice_id = 'rachel'

        # Validate numerical values
        try:
            speed = float(speed)
            clarity = float(clarity)
            
            speed = max(0.25, min(2.0, speed))
            clarity = max(0.0, min(1.0, clarity))
        except (ValueError, TypeError):
            speed = 1.0
            clarity = 0.75

        # Get voice ID
        selected_voice_id = AVAILABLE_VOICES[voice_id]['id']

        # Prepare request to ElevenLabs API
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{selected_voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": clarity,
                "similarity_boost": 0.7,
                "style": 0.2,
                "use_speaker_boost": True
            }
        }

        # Make request to ElevenLabs
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            # Convert audio to base64 for frontend
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            logger.info("Audio generated successfully")
            
            return jsonify({
                'success': True,
                'audio_data': f"data:audio/mpeg;base64,{audio_base64}",
                'voice_name': AVAILABLE_VOICES[voice_id]['name']
            })
        else:
            logger.error(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return jsonify({'error': 'Unable to generate audio at this time. Please try again in a few moments'}), 500

    except requests.exceptions.Timeout:
        logger.error("Request timeout")
        return jsonify({'error': 'Unable to generate audio at this time. Please try again in a few moments'}), 500
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return jsonify({'error': 'Unable to generate audio at this time. Please try again in a few moments'}), 500
        
    except Exception as e:
        logger.error(f"Audio generation failed: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Unable to generate audio at this time. Please try again in a few moments'}), 500

@app.route('/download', methods=['POST'])
def download_audio():
    try:
        data = request.json
        audio_data = data.get('audio_data', '')
        
        if not audio_data or not audio_data.startswith('data:audio/mpeg;base64,'):
            return jsonify({'error': 'Unable to download audio. Please try generating new audio'}), 400
        
        # Extract base64 data
        base64_data = audio_data.split(',')[1]
        audio_bytes = base64.b64decode(base64_data)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_file.write(audio_bytes)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name='voice-reactor-audio.mp3',
            mimetype='audio/mpeg'
        )
        
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        return jsonify({'error': 'Unable to download audio. Please try again'}), 500

if __name__ == '__main__':
    app.run(debug=True)