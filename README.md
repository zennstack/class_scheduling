# Class Scheduling System

A full-stack web application for orchestrating academic class schedules. It features a modern React-based dashboard and a Django API backend with intelligent conflict detection to prevent overlapping classes in the same room or assigning multiple classes to the same instructor.

## Tech Stack
- **Backend:** Django, Django REST Framework, SimpleJWT, Jazzmin
- **Frontend:** React, Vite, Lucide-React, React-Big-Calendar

## Setup Instructions

This project consists of two parts: the Django API backend and the React frontend. You will need to run both simultaneously.

---

### Backend Setup (Django)

1. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate # macOS/Linux
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Apply Migrations**
   ```bash
   # Make sure you are in the directory containing manage.py
   python manage.py migrate
   ```

4. **Run the Server**
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000/api/`

---

### Frontend Setup (React)

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173/`

---

## Testing the API
You can run the provided test script to verify that the endpoints and conflict detection logic are working correctly:

```bash
python test_api.py
```

## Features
- **Scheduling Hub:** Central dashboard to manage all class schedules.
- **Resource Management:** Add and edit Rooms, Instructors, and Courses.
- **Calendar View:** A visual timetable of all scheduled activities.
- **Conflict Detection:** Automatic validation for room and instructor availability.
- **User Profiles:** Manage account details and security settings.
- **Admin Panel:** Beautifully designed Django admin interface via Jazzmin.
