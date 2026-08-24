import uuid
# pyrefly: ignore [missing-import]
import pytest
import time
from fastapi.testclient import TestClient
from main import app
from app.api.routers.auth import otp_store
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_otp_registration_full_lifecycle():
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"test_cfo_{unique_id}@novacorp.com"
    test_phone = "+919876543210"
    test_password = "StrongPassword2026!"

    # Clean up state
    otp_store.pop(test_email, None)
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()

    # 1. Request OTP
    req_resp = client.post(
        "/api/auth/register/request-otp",
        json={"email": test_email, "phone": test_phone},
    )
    assert req_resp.status_code == 200
    data = req_resp.json()
    assert "dev_otp" in data
    assert len(data["dev_otp"]) == 6
    assert data["expires_in_seconds"] == 300
    assert data["cooldown_seconds"] == 60
    first_otp = data["dev_otp"]

    # 2. Rate limiting check (cooldown active)
    cooldown_resp = client.post(
        "/api/auth/register/request-otp",
        json={"email": test_email, "phone": test_phone},
    )
    assert cooldown_resp.status_code == 429
    assert "Please wait" in cooldown_resp.json()["detail"]

    # 3. Test Invalid Attempts Decrementing (Attempt 1 and 2)
    bad_1 = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": "000000" if first_otp != "000000" else "111111",
            "password": test_password,
            "full_name": "Test User",
            "role": "CFO",
            "organization_id": "NOVA COMMERCE",
        },
    )
    assert bad_1.status_code == 400
    assert "2 attempt(s) remaining" in bad_1.json()["detail"]

    bad_2 = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": "000000" if first_otp != "000000" else "111111",
            "password": test_password,
            "full_name": "Test User",
            "role": "CFO",
            "organization_id": "NOVA COMMERCE",
        },
    )
    assert bad_2.status_code == 400
    assert "1 attempt(s) remaining" in bad_2.json()["detail"]

    # 4. Attempt 3 (Lockout & Session Invalidation)
    bad_3 = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": "000000" if first_otp != "000000" else "111111",
            "password": test_password,
            "full_name": "Test User",
            "role": "CFO",
            "organization_id": "NOVA COMMERCE",
        },
    )
    assert bad_3.status_code == 400
    assert "Maximum attempts reached" in bad_3.json()["detail"]

    # 5. Subsequent attempts without new OTP request must fail with no OTP record
    bad_after_lockout = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": first_otp,
            "password": test_password,
            "full_name": "Test User",
            "role": "CFO",
            "organization_id": "NOVA COMMERCE",
        },
    )
    assert bad_after_lockout.status_code == 400
    assert "No verification code was requested" in bad_after_lockout.json()["detail"]

    # 6. Request a fresh OTP (simulating cooldown expiration)
    otp_store.pop(test_email, None) # simulate cooldown elapsed
    req_fresh = client.post(
        "/api/auth/register/request-otp",
        json={"email": test_email, "phone": test_phone},
    )
    assert req_fresh.status_code == 200
    fresh_otp = req_fresh.json()["dev_otp"]

    # 7. Successful verification & workspace provisioning with custom tenant name
    good_verify = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": fresh_otp,
            "password": test_password,
            "full_name": "Ananya Sharma",
            "role": "BUSINESS_ANALYST",
            "organization_id": "Apex Quantum Holdings",
        },
    )
    assert good_verify.status_code == 200
    res_data = good_verify.json()
    assert "access_token" in res_data
    assert res_data["token_type"] == "bearer"
    assert res_data["user"]["email"] == test_email
    assert res_data["user"]["role"] == "BUSINESS_ANALYST"
    assert res_data["user"]["full_name"] == "Ananya Sharma"

    # 8. Replay prevention: OTP must have been wiped
    replay = client.post(
        "/api/auth/register/verify-otp",
        json={
            "email": test_email,
            "otp": fresh_otp,
            "password": test_password,
            "full_name": "Ananya Sharma",
            "role": "BUSINESS_ANALYST",
        },
    )
    assert replay.status_code == 400

    # Clean up created test user
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
    finally:
        db.close()
