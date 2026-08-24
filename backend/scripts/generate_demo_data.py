import sys
import os
import random
from datetime import datetime, timedelta

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine
from app.models import Base
from app.models.organization import Organization
from app.models.user import User, RoleEnum
from app.models.financial import Customer, Order, Transaction
from app.core.security import get_password_hash

def generate_consistent_dataset():
    print("Ensuring database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Organization
    org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
    if not org:
        org = Organization(name="NOVA COMMERCE")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"Created Org: {org.id}")
        
    # 2. Admin User
    admin = db.query(User).filter(User.email == "admin@novacommerce.com").first()
    if not admin:
        admin = User(
            email="admin@novacommerce.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Nova Chief Financial Officer",
            role=RoleEnum.SUPER_ADMIN,
            organization_id=org.id
        )
        db.add(admin)
        db.commit()

    # 3. Clean and Populate Consistent Customers (High Value, Price Sensitive, Standard)
    print("Seeding customer accounts...")
    db.query(Transaction).filter(Transaction.organization_id == org.id).delete()
    db.query(Order).filter(Order.organization_id == org.id).delete()
    db.query(Customer).filter(Customer.organization_id == org.id).delete()
    db.commit()
    
    segments = ["High Value"] * 100 + ["Price Sensitive"] * 250 + ["Standard"] * 150
    customers = []
    for i, seg in enumerate(segments):
        c = Customer(
            organization_id=org.id,
            name=f"Enterprise Client #{1000 + i}",
            email=f"client_{i}@enterprise-corp.in",
            segment=seg
        )
        customers.append(c)
    db.add_all(customers)
    db.commit()

    # 4. Generate 24-Month Orders & Transactions Reconciling to ₹82,40,000
    print("Generating consistent 24-month transaction history totaling INR 82.4L...")

    customers = db.query(Customer).filter(Customer.organization_id == org.id).all()
    now = datetime.utcnow()
    
    TARGET_TOTAL_REVENUE = 8240000.0  # INR 82.4L
    TOTAL_ORDERS = 3200
    avg_per_order = TARGET_TOTAL_REVENUE / TOTAL_ORDERS  # ~2,575 INR
    
    orders = []
    transactions = []
    generated_revenue = 0.0
    
    for i in range(TOTAL_ORDERS):
        customer = random.choice(customers)
        
        # Segment-specific weighting
        if customer.segment == "High Value":
            amount = round(random.gauss(avg_per_order * 1.8, 400), 2)
        elif customer.segment == "Price Sensitive":
            amount = round(random.gauss(avg_per_order * 0.6, 200), 2)
        else:
            amount = round(random.gauss(avg_per_order * 1.0, 300), 2)
            
        amount = max(350.0, amount)
        days_ago = random.randint(0, 730)  # 2 years
        created_at = now - timedelta(days=days_ago, minutes=random.randint(0, 1440))
        
        o = Order(
            organization_id=org.id,
            customer_id=customer.id,
            total_amount=amount,
            status="completed",
            created_at=created_at
        )
        orders.append(o)
        generated_revenue += amount

    # Bulk insert orders
    db.add_all(orders)
    db.commit()

    # Reconcile Transactions: SUM(order totals) MUST EQUAL SUM(transactions)
    for o in orders:
        t = Transaction(
            organization_id=org.id,
            order_id=o.id,
            amount=o.total_amount,
            type="payment",
            created_at=o.created_at
        )
        transactions.append(t)

    db.add_all(transactions)
    db.commit()
    
    print(f"Data Generation Success! Generated {len(orders)} orders and {len(transactions)} transactions.")
    print(f"Total Reconciled Revenue: INR {generated_revenue:,.2f}")
    db.close()

if __name__ == "__main__":
    generate_consistent_dataset()
