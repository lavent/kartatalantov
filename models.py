from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class TestResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parent_name = db.Column(db.String(100), nullable=False)
    child_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    grade = db.Column(db.Integer, nullable=False)
    city = db.Column(db.String(100), nullable=False)  # Добавляем поле для города
    personality_type = db.Column(db.String(100))  # Полное название типа личности
    type_code = db.Column(db.String(10))  # Буквенный код типа (например, "R+A")
    test_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)  # Добавляем статус прохождения
    
    def __repr__(self):
        return f'<TestResult {self.child_name} - {self.type_code}>' 