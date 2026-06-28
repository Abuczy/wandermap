from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import requests

import models
import schemas
from database import engine, get_db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# tworzy tabele w bazie na starcie
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="WanderMap API")

# pozwala frontendowi (React) gadać z backendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import os
from dotenv import load_dotenv

load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")

# ---------------- TEST ----------------
@app.get("/")
def root():
    return {"message": "WanderMap API działa!"}


# ---------------- AUTH ----------------
@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email już zarejestrowany")
    new_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło",
        )
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ---------------- DESTINATIONS (CRUD) ----------------
@app.post("/destinations", response_model=schemas.DestinationOut)
def create_destination(
    dest: schemas.DestinationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_dest = models.Destination(**dest.dict(), owner_id=current_user.id)
    db.add(new_dest)
    db.commit()
    db.refresh(new_dest)
    return new_dest


@app.get("/destinations", response_model=List[schemas.DestinationOut])
def get_destinations(
    status: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Destination).filter(
        models.Destination.owner_id == current_user.id
    )
    if status:
        query = query.filter(models.Destination.status == status)
    if country:
        query = query.filter(models.Destination.country == country)
    return query.all()


@app.get("/destinations/{dest_id}", response_model=schemas.DestinationOut)
def get_destination(
    dest_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dest = _get_owned_destination(dest_id, db, current_user)
    return dest


@app.put("/destinations/{dest_id}", response_model=schemas.DestinationOut)
def update_destination(
    dest_id: int,
    updated: schemas.DestinationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dest = _get_owned_destination(dest_id, db, current_user)
    for key, value in updated.dict().items():
        setattr(dest, key, value)
    db.commit()
    db.refresh(dest)
    return dest


@app.delete("/destinations/{dest_id}")
def delete_destination(
    dest_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dest = _get_owned_destination(dest_id, db, current_user)
    db.delete(dest)
    db.commit()
    return {"message": "Destynacja usunięta"}


# pomocnicza funkcja: pobiera destynację i sprawdza, czy należy do usera
def _get_owned_destination(dest_id, db, current_user):
    dest = db.query(models.Destination).filter(
        models.Destination.id == dest_id
    ).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destynacja nie znaleziona")
    if dest.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Brak dostępu")
    return dest


# ---------------- WEATHER ----------------
@app.get("/weather")
def get_weather(city: str, current_user: models.User = Depends(get_current_user)):
    if OPENWEATHER_API_KEY == "TWOJ_KLUCZ_TUTAJ":
        raise HTTPException(status_code=400, detail="Brak klucza API pogody")
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "lang": "pl",
    }
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Nie znaleziono miasta")
    data = resp.json()
    return {
        "city": data["name"],
        "temp": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],
    }

# ---------------- UNSPLASH ----------------
@app.get("/unsplash")
def get_unsplash_photo(
    query: str,
    current_user: models.User = Depends(get_current_user),
):
    if not UNSPLASH_ACCESS_KEY:
        raise HTTPException(status_code=400, detail="Brak klucza Unsplash API")
    
    url = "https://api.unsplash.com/search/photos"
    headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
    params = {"query": query, "per_page": 1, "orientation": "landscape"}
    
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Błąd Unsplash API")
    
    data = resp.json()
    results = data.get("results", [])
    if not results:
        return {"url": None}
    
    photo = results[0]
    return {
        "url": photo["urls"]["regular"],
        "thumb": photo["urls"]["thumb"],
        "author": photo["user"]["name"],
        "author_link": photo["user"]["links"]["html"],
    }