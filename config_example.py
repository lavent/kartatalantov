import os

class Config:
    # Секретный ключ берется из переменных окружения
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Данные для админ-панели
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
    
    # URL базы данных берется из переменных окружения (Railway автоматически добавляет эту переменную)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///test_results.db')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
    
    # Отключаем отслеживание изменений в SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False 