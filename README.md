## Backend Setup

The backend is a FastAPI application that handles contract generation and queries.

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Create and activate a virtual environment (if not already created)

**On macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the backend server

```bash
uvicorn app:app --reload
```

## Frontend Setup

The frontend is a React application built with Vite and TypeScript.

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```
