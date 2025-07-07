from fastapi import APIRouter, UploadFile, File, Depends
import shutil
import os

router = APIRouter(prefix="/api/files", tags=["files"])

UPLOAD_DIR = "./uploads"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Return the relative path for saving to DB or returning to frontend
    return {"url": f"/uploads/{file.filename}"}
