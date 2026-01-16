# 🎙️ Sumarizer

<div align="center">

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

**An AI-powered platform that transforms blog articles into engaging video scripts and converts text to lifelike speech using multiple voice models.**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Voice Models](#-voice-models)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Sumarizer** is a powerful dual-purpose application that combines AI content generation with advanced text-to-speech capabilities. It helps content creators transform written blog posts into video-ready scripts complete with image prompts and hashtags, while also providing professional-grade voice synthesis through Piper TTS.

### What Makes Sumarizer Special?

- 🤖 **AI-Powered Content Generation**: Converts blog articles into video scripts with hooks, key points, and CTAs
- 🎨 **Image Prompt Generation**: Creates detailed AI image prompts for visual storytelling
- 🏷️ **Social Media Ready**: Generates relevant hashtags for maximum reach
- 🎙️ **Multi-Voice TTS**: Supports multiple languages, genders, and voice qualities
- 💬 **Streaming Chat Interface**: Real-time AI responses with markdown support
- 🌐 **CORS Proxy Integration**: Fetches content from any accessible URL

---

## ✨ Features

### Chat & Summarization Module

- **URL-based Content Extraction**: Paste any blog URL to extract article content
- **Smart Content Parsing**: Intelligently identifies and extracts main article content
- **AI Video Script Generation**: Creates 30-60 second video scripts optimized for engagement
- **Image Prompt Creation**: Generates 5-7 detailed AI image prompts for visual content
- **Hashtag Suggestions**: Provides 5-8 relevant hashtags for social media
- **Streaming Responses**: Real-time AI output with markdown formatting
- **Chat History**: Maintains conversation context for iterative improvements

### Text-to-Speech Module

- **Multiple Voice Models**: Supports various languages (English, French) and accents (US, GB, FR)
- **Gender Selection**: Choose between male and female voices
- **Quality Options**: High and medium quality voice models
- **Audio Preview**: Built-in audio player for instant playback
- **Download Support**: Save generated audio files locally
- **Model Metadata**: Displays detailed information about each voice model

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────────────┐           ┌─────────────────┐         │
│  │   Chat Module   │           │   TTS Module    │         │
│  │  - URL Input    │           │  - Text Input   │         │
│  │  - Streaming    │           │  - Voice Select │         │
│  │  - Markdown     │           │  - Audio Player │         │
│  └────────┬────────┘           └────────┬────────┘         │
└───────────┼─────────────────────────────┼──────────────────┘
            │                              │
            ▼                              ▼
  ┌─────────────────┐          ┌──────────────────────┐
  │   LLM Server    │          │   FastAPI Backend    │
  │ (Llama/OpenAI)  │          │   - /models          │
  │                 │          │   - /tts             │
  │  Streaming API  │          │   - Piper TTS        │
  └─────────────────┘          └──────────┬───────────┘
                                          │
                                          ▼
                               ┌────────────────────┐
                               │   Voice Models     │
                               │  - Female (US/GB)  │
                               │  - Male (US/GB)    │
                               │  - French (FR)     │
                               └────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - Modern UI library with latest features
- **TypeScript 5.9** - Type-safe development
- **Vite 7.2** - Lightning-fast build tool
- **Tailwind CSS 4.1** - Utility-first styling
- **React Markdown** - Markdown rendering with GitHub Flavored Markdown support
- **Lucide React** - Beautiful icon library

### Backend
- **FastAPI** - High-performance Python web framework
- **Piper TTS** - Neural text-to-speech engine
- **Uvicorn** - ASGI server for production deployment
- **Pydantic** - Data validation and settings management

### AI Integration
- **LLM API** - Compatible with OpenAI, Llama, or any OpenAI-compatible endpoint
- **Streaming Support** - Server-sent events (SSE) for real-time responses

---

## 📦 Prerequisites

Before installing Sumarizer, ensure you have the following:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/)
- **Piper TTS** - [Installation Guide](https://github.com/rhasspy/piper)
- **LLM Server** (Llama.cpp, Ollama, or OpenAI API)
- **Git** - For cloning the repository

### Installing Piper TTS

#### Linux
```bash
wget https://github.com/rhasspy/piper/releases/latest/download/piper_amd64.tar.gz
tar -xvzf piper_amd64.tar.gz
sudo mv piper /usr/local/bin/
```

#### macOS
```bash
brew install piper-tts
```

#### Windows
Download from [GitHub Releases](https://github.com/rhasspy/piper/releases) and add to PATH.

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sumarizer.git
cd sumarizer
```

### 2. Backend Setup

```bash
# Navigate to the API directory
cd api

# Install Python dependencies
pip install -r requirements.txt

# Download voice models (optional - models are included)
# Or add your own models to the male/female directories

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API server will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to the client directory
cd ../client

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. LLM Server Setup

You'll need a running LLM server. Here are some options:

#### Option A: Llama.cpp Server
```bash
# Download llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Download a model (e.g., Llama 2)
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf

# Start the server
./server -m llama-2-7b-chat.Q4_K_M.gguf --port 10000
```

#### Option B: Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2

# Run the server (it starts automatically)
ollama serve
```

#### Option C: OpenAI API
Configure your OpenAI API key and use `https://api.openai.com/v1` as the endpoint.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the client directory:

```env
VITE_LLAMA_ENDPOINT=http://localhost:10000
VITE_TTS_ENDPOINT=http://127.0.0.1:8000
```

### In-App Configuration

Click the **Settings** icon (⚙️) in the top-right corner to configure:

- **Chat API Endpoint**: URL of your LLM server (default: `http://localhost:10000`)
- **TTS API Endpoint**: URL of your FastAPI server (default: `http://127.0.0.1:8000`)

---

## 💻 Usage

### Chat & Summarization

1. **Select the Chat Tab**: Click on "Chat / Summary" in the header
2. **Paste a Blog URL**: Enter the URL of any blog post you want to summarize
3. **Submit**: Press Enter or click the Send button
4. **View Results**: Watch as the AI generates:
   - A compelling video script with hook, points, and CTA
   - 5-7 detailed image prompts for AI art generators
   - 5-8 relevant hashtags for social media

### Text-to-Speech

1. **Select the TTS Tab**: Click on "Text to Speech" in the header
2. **Choose a Voice Model**: Select from available voice models
   - Filter by gender, language, and quality
3. **Enter Text**: Type or paste the text you want to convert
4. **Generate**: Click "Generate Audio"
5. **Preview & Download**: 
   - Play the audio directly in the browser
   - Download the audio file for offline use

---

## 📡 API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 1. List All Voice Models
```http
GET /models
```

**Response:**
```json
[
  {
    "id": "female_us_en_US-hfc_female-medium.onnx",
    "name": "en_US-hfc_female-medium",
    "gender": "female",
    "language": "en",
    "country": "US",
    "path": "/path/to/model.onnx",
    "quality": "medium",
    "description": "American English female voice"
  }
]
```

#### 2. Get Specific Model Details
```http
GET /models/{model_id}
```

**Parameters:**
- `model_id` (path): The unique identifier of the voice model

**Response:**
```json
{
  "id": "female_us_en_US-hfc_female-medium.onnx",
  "name": "en_US-hfc_female-medium",
  "gender": "female",
  "language": "en",
  "country": "US",
  "path": "/path/to/model.onnx",
  "quality": "medium",
  "description": "American English female voice"
}
```

#### 3. Generate Speech
```http
POST /tts
```

**Request Body:**
```json
{
  "text": "Hello, world! This is a test of the text-to-speech system.",
  "model_id": "female_us_en_US-hfc_female-medium.onnx",
  "output_filename": "my_speech.wav"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Speech generated successfully",
  "output_file": "/absolute/path/to/my_speech.wav"
}
```

#### 4. Health Check
```http
GET /
```

**Response:**
```json
{
  "message": "Voice Model API Server",
  "endpoints": {
    "GET /models": "Get list of available voice models",
    "GET /models/{model_id}": "Get details of a specific model",
    "POST /tts": "Generate speech using a model"
  }
}
```

---

## 🎤 Voice Models

Sumarizer comes with multiple pre-configured voice models:

### Female Voices

| Language | Country | Model | Quality | Description |
|----------|---------|-------|---------|-------------|
| English | US | hfc_female | Medium | Natural American female voice |
| English | US | lessac | High | High-quality expressive voice |
| English | GB | alba | Medium | British female voice |
| French | FR | siwis | Medium | French female voice |

### Male Voices

| Language | Country | Model | Quality | Description |
|----------|---------|-------|---------|-------------|
| English | US | bryce | Medium | Natural American male voice |

### Adding Custom Voice Models

1. Download ONNX models from [Piper Voices](https://github.com/rhasspy/piper/blob/master/VOICES.md)
2. Place the `.onnx` file and its `.onnx.json` config in the appropriate directory:
   - `api/female/{country}/` for female voices
   - `api/male/{country}/` for male voices
3. Restart the API server
4. The model will automatically appear in the voice selection dropdown

---

## 📁 Project Structure

```
sumarizer/
├── api/                          # FastAPI Backend
│   ├── main.py                   # Main API application
│   ├── requirements.txt          # Python dependencies
│   ├── female/                   # Female voice models
│   │   ├── fr/                   # French models
│   │   ├── gb/                   # British English models
│   │   └── us/                   # American English models
│   └── male/                     # Male voice models
│       ├── gb/                   # British English models
│       └── us/                   # American English models
│
├── client/                       # React Frontend
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # Application entry point
│   │   ├── index.css            # Global styles
│   │   └── assets/              # Static assets
│   ├── public/                   # Public files
│   ├── package.json             # Node.js dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite configuration
│   └── index.html               # HTML entry point
│
└── README.md                     # This file
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Piper TTS is not installed or not found in PATH"

**Solution:**
```bash
# Verify Piper installation
which piper

# If not found, reinstall Piper and add to PATH
export PATH=$PATH:/path/to/piper
```

#### Issue: "Failed to fetch voice models"

**Solution:**
- Ensure the API server is running on port 8000
- Check that the `api/female/` and `api/male/` directories exist
- Verify ONNX model files are present

#### Issue: "Could not fetch URL"

**Solution:**
- Verify the blog URL is accessible
- Check your internet connection
- Try a different CORS proxy in the code
- Some sites may block scraping

#### Issue: "LLM Error: Connection refused"

**Solution:**
- Ensure your LLM server is running
- Verify the correct endpoint in Settings
- Check firewall settings

#### Issue: CORS errors in browser

**Solution:**
- The API already has CORS enabled for all origins
- For production, update the `allow_origins` in `api/main.py`

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the issue already exists
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its benefits
3. Include mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Piper TTS** - For the excellent neural TTS engine
- **FastAPI** - For the amazing Python web framework
- **React Team** - For the powerful UI library
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide** - For the beautiful icon set

---

## 📞 Support

Need help? Here are some ways to get support:

- 📧 **Email**: support@sumarizer.com
- 💬 **Discord**: [Join our community](https://discord.gg/sumarizer)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/sumarizer/issues)
- 📖 **Documentation**: [Wiki](https://github.com/yourusername/sumarizer/wiki)

---

## 🗺️ Roadmap

- [ ] Add more language support (Spanish, German, Italian)
- [ ] Implement voice cloning capabilities
- [ ] Add batch processing for multiple URLs
- [ ] Export scripts as PDF/DOCX
- [ ] Integration with video editing tools
- [ ] Mobile app version
- [ ] Voice effects and audio post-processing
- [ ] User authentication and saved projects
- [ ] API rate limiting and usage analytics
- [ ] Docker containerization

---

<div align="center">

**Made with ❤️ by the Sumarizer Team**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/yourusername/sumarizer/issues) • [Request Feature](https://github.com/yourusername/sumarizer/issues) • [Documentation](https://github.com/yourusername/sumarizer/wiki)

</div>
