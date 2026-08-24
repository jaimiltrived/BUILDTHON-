from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import io
import json

from app.api import deps
from app.models.user import User
from app.models.organization import Organization
from app.models.document import Document

router = APIRouter()

def get_org_id(db: Session, current_user: User) -> str:
    org_id = current_user.organization_id
    if not org_id:
        org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
        if not org:
            org = db.query(Organization).first()
        if org:
            org_id = org.id
    return org_id or "default-org"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    org_id = get_org_id(db, current_user)
    
    filename = file.filename
    content = await file.read()
    
    extracted_text = ""
    
    # 1. Handle PDF
    if filename.endswith(".pdf"):
        try:
            # pyrefly: ignore [missing-import]
            from pypdf import PdfReader
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            pages_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {e}")
            
    # 2. Handle CSV
    elif filename.endswith(".csv"):
        try:
            import csv
            text_stream = io.StringIO(content.decode("utf-8", errors="ignore"))
            reader = csv.reader(text_stream)
            rows_text = []
            for row in reader:
                rows_text.append(", ".join(row))
            extracted_text = "\n".join(rows_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV document: {e}")
            
    # 3. Handle JSON
    elif filename.endswith(".json"):
        try:
            data = json.loads(content.decode("utf-8", errors="ignore"))
            extracted_text = json.dumps(data, indent=2)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse JSON document: {e}")
            
    # 4. Handle TXT
    else:
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse text document: {e}")
            
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded document contains no readable text content.")
        
    doc = Document(
        organization_id=org_id,
        filename=filename,
        content=extracted_text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {
        "id": doc.id,
        "filename": doc.filename,
        "message": f"Successfully parsed and ingested document '{filename}' into RAG memory.",
        "created_at": doc.created_at.isoformat()
    }

@router.get("/")
def list_documents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    org_id = get_org_id(db, current_user)
    docs = db.query(Document).filter(Document.organization_id == org_id).all()
    
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "char_count": len(doc.content),
            "created_at": doc.created_at.isoformat()
        }
        for doc in docs
    ]

@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    org_id = get_org_id(db, current_user)
    doc = db.query(Document).filter(Document.id == doc_id, Document.organization_id == org_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
        
    db.delete(doc)
    db.commit()
    
    return {"message": f"Successfully removed document '{doc.filename}' from RAG memory."}
