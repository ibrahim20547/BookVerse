import os
import sys

# Add backend directory to Python sys.path so backend modules can be imported
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app

# WSGI application entrypoint for Vercel Serverless Function
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
