# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Integer
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    segment = Column(String(100))  # e.g., 'High Value', 'Price Sensitive'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), index=True)
    
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    transactions = relationship("Transaction", back_populates="order")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), index=True)
    
    amount = Column(Float, nullable=False)
    type = Column(String(50)) # e.g., 'payment', 'refund'
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="transactions")
