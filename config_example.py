import os

class Config:
    # Используем переменные окружения или значения по умолчанию
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME') or 'admin'
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'admin'
    
    # База данных
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///test_results.db'
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False 