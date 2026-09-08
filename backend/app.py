import os
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from extensions import db, jwt

def create_app():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='/')
    CORS(app)
    
    # Configuration
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///library.db')
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
    
    # Init Extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Import and register blueprints/routes
    with app.app_context():
        from models import User, Category, Book, BorrowRecord
        db.create_all()
        
        from routes import bp
        app.register_blueprint(bp, url_prefix='/api')

        # Catch all route for React Router (Single Page Application)
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve(path):
            if path.startswith('api/') or path == 'api':
                return jsonify({'message': 'API endpoint not found'}), 404
            file_path = os.path.join(app.static_folder, path)
            if path != "" and os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(app.static_folder, path)
            else:
                return send_from_directory(app.static_folder, 'index.html')

        @app.errorhandler(404)
        def not_found(e):
            if request.path.startswith('/api'):
                return jsonify({'message': 'API endpoint not found'}), 404
            return send_from_directory(app.static_folder, 'index.html')
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', debug=False, port=5000)
