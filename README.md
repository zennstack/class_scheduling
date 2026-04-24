# Class Scheduling System

A Django-based API backend for managing class schedules. It features conflict detection to prevent scheduling overlapping classes in the same room or assigning overlapping classes to the same instructor.

## Setup Instructions

Follow these instructions to get the backend running locally.

### 1. Create a Virtual Environment
It's recommended to run this project inside a Python virtual environment to keep dependencies isolated.

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
Once your virtual environment is active, install the required packages:

```bash
pip install -r requirements.txt
```

### 3. Apply Migrations
Set up your local SQLite database with the necessary tables:

```bash
cd ClassScheduling
python manage.py migrate
```

### 4. Create a Superuser (Optional but Recommended)
To access the Django Admin panel at `http://127.0.0.1:8000/admin`:

```bash
python manage.py createsuperuser
```

### 5. Run the Server
Start the local development server:

```bash
python manage.py runserver
```

The API will now be available at `http://127.0.0.1:8000/api/`

## Testing the API
You can run the provided test script to quickly verify that the endpoints and conflict detection logic are working correctly. 

Open a **new terminal window** (keep the server running in the first one), activate your virtual environment, and run:

```bash
python test_api.py
```
