# WanderMap

Aplikacja webowa do tworzenia i zarządzania listą miejsc do odwiedzenia (podróżnicza wish lista). Umożliwia przeglądanie informacji o destynacjach, wyświetlanie ich na interaktywnej mapie oraz śledzenie historii odbytych podróży.

Projekt zespołowy na przedmiot **Nowatorski Projekt Zespołowy**.
Zespół: Aleksandra Buczyłowska (55437), Oliwia Kata (54518).

## Funkcjonalności

- Rejestracja i logowanie użytkowników (JWT)
- Dodawanie destynacji do listy (nazwa, kraj, opis, status: planowane / odwiedzone)
- Pełne CRUD destynacji (dodawanie, edycja, usuwanie)
- Wyświetlanie destynacji na interaktywnej mapie (Leaflet + OpenStreetMap)
- Pobieranie aktualnej pogody dla miejsca (OpenWeatherMap API)
- Oznaczanie miejsc jako odwiedzone
- Responsywny interfejs użytkownika

## Technologie

**Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy, JWT (python-jose), bcrypt
**Frontend:** React, Vite, Leaflet.js, Axios
**Zewnętrzne API:** OpenWeatherMap
**Devops:** Docker (PostgreSQL), GitHub

## Struktura projektu
wandermap/
├── backend/      
└── frontend/     

### Wymagania

- Python 3.11+
- Node.js 18+
- Docker Desktop

### 1. Baza danych (PostgreSQL w Dockerze)

```bash
docker run --name wandermap-db \
  -e POSTGRES_USER=wander \
  -e POSTGRES_PASSWORD=wander123 \
  -e POSTGRES_DB=wandermap \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary "python-jose[cryptography]" bcrypt python-multipart requests "pydantic[email]" python-dotenv
```

Utwórz plik `backend/.env` i wpisz swój klucz API z OpenWeatherMap:
OPENWEATHER_API_KEY=twoj_klucz_tutaj

Uruchom serwer:

```bash
uvicorn main:app --reload
```

Backend dostępny pod `http://127.0.0.1:8000`, dokumentacja API pod `http://127.0.0.1:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`.

## Etapy realizacji

- **Etap 1** : konfiguracja projektu, autoryzacja JWT, pełne CRUD destynacji, mapa Leaflet, integracja z API pogody, responsywny interfejs.
- **Etap 2** : integracja z Unsplash (zdjęcia), link do Google Flights, filtrowanie i sortowanie, statystyki użytkownika, CI/CD.

