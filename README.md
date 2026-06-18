MarineX is an AI-powered marine information assistant that uses OCR and Retrieval-Augmented Generation (RAG) to answer marine-related questions from documents and images.

Features
Extracts text from marine documents and images
Uses RAG for accurate information retrieval
Generates responses using the Gemma language model
Flask-based backend for easy deployment
Project Structure
MarineX/
├── website/
├── marine_ocr.py
├── RAG_model_flask.py
├── RAG_model_gemma.ipynb
├── LICENSE
└── README.md
Installation
git clone https://github.com/SaketGudimella/MarineX.git
cd MarineX
pip install -r requirements.txt
Usage

Run the Flask application:

python RAG_model_flask.py

Or open RAG_model_gemma.ipynb in Jupyter Notebook to test the model.

Technologies Used
Python
Flask
OCR
RAG
Gemma LLM
