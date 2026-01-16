from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import subprocess
import json
from typing import List, Dict, Optional
from pathlib import Path
import uuid

app = FastAPI(title="Voice Model API Server",
              description="API for listing and using voice models with Piper TTS")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files to serve generated audio
app.mount("/static", StaticFiles(directory="."), name="static")


class VoiceModel(BaseModel):
    id: str
    name: str
    gender: str
    language: str
    country: str
    path: str
    quality: str
    description: Optional[str] = None


class TTSPayload(BaseModel):
    text: str
    model_id: str
    output_filename: Optional[str] = None


class TTSResponse(BaseModel):
    success: bool
    message: str
    output_file: Optional[str] = None


def scan_voice_models():
    """Scan the female and male directories to find all available voice models"""
    voice_models = []

    # Define the base directory
    base_dir = Path(__file__).parent

    # Scan female and male directories
    for gender in ['female', 'male']:
        gender_path = base_dir / gender

        if not gender_path.exists():
            continue

        for country_dir in gender_path.iterdir():
            if country_dir.is_dir():
                for model_file in country_dir.glob("*.onnx"):
                    # Extract information from filename
                    filename = model_file.stem
                    parts = filename.split('-')

                    if len(parts) >= 3:
                        lang_country = parts[0]  # e.g., fr_FR, en_GB, en_US
                        quality = parts[-1]      # e.g., medium, high

                        if '_' in lang_country:
                            lang, country = lang_country.split('_', 1)
                        else:
                            lang, country = lang_country, 'unknown'

                        # Get description from the .json file if available
                        json_file = model_file.with_suffix('.json')
                        description = None
                        if json_file.exists():
                            try:
                                with open(json_file, 'r') as f:
                                    json_data = json.load(f)
                                    description = json_data.get(
                                        'description', None)
                            except Exception:
                                pass

                        # Create model ID from path
                        model_id = str(model_file.relative_to(base_dir)).replace(
                            '/', '_').replace('\\', '_')

                        voice_model = VoiceModel(
                            id=model_id,
                            name=filename,
                            gender=gender,
                            language=lang,
                            country=country,
                            path=str(model_file),
                            quality=quality,
                            description=description
                        )
                        voice_models.append(voice_model)

    return voice_models


@app.get("/models", response_model=List[VoiceModel])
async def get_available_models():
    """Get a list of all available voice models"""
    models = scan_voice_models()
    return models


@app.get("/models/{model_id}")
async def get_model_details(model_id: str):
    """Get details of a specific voice model"""
    models = scan_voice_models()
    for model in models:
        if model.id == model_id:
            return model
    raise HTTPException(
        status_code=404, detail=f"Model with ID {model_id} not found")


@app.post("/tts", response_model=TTSResponse)
async def generate_speech(payload: TTSPayload):
    """Generate speech using Piper TTS with the specified model and text"""

    # Validate model exists
    models = scan_voice_models()
    selected_model = None
    for model in models:
        if model.id == payload.model_id:
            selected_model = model
            break

    if not selected_model:
        raise HTTPException(
            status_code=404, detail=f"Model with ID {payload.model_id} not found")

    # Generate output filename if not provided
    if not payload.output_filename:
        payload.output_filename = f"output_{uuid.uuid4().hex[:8]}.wav"

    # Ensure output filename has .wav extension
    if not payload.output_filename.endswith('.wav'):
        payload.output_filename += '.wav'

    # Build the Piper command
    cmd = [
        "piper",
        "-m", selected_model.path,
        "-f", payload.output_filename
    ]

    try:
        # Execute the Piper TTS command with the input text
        result = subprocess.run(
            cmd,
            input=payload.text,
            text=True,
            capture_output=True,
            check=True
        )

        # Check if output file was created
        output_path = Path(payload.output_filename)
        if output_path.exists():
            return TTSResponse(
                success=True,
                message="Speech generated successfully",
                output_file=str(output_path.absolute())
            )
        else:
            raise HTTPException(
                status_code=500, detail="Output file was not created")

    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Piper TTS failed: {e.stderr.decode() if e.stderr else str(e)}"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Piper TTS is not installed or not found in PATH. Please install Piper TTS first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during speech generation: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint with basic information"""
    return {
        "message": "Voice Model API Server",
        "endpoints": {
            "GET /models": "Get list of available voice models",
            "GET /models/{model_id}": "Get details of a specific model",
            "POST /tts": "Generate speech using a model"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
