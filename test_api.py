import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    print("--- Class Scheduling API Test ---")

    print("\n1. Registering an Instructor User...")
    user_data = {
        "username": "instructor_joe",
        "password": "securepassword123",
        "email": "joe@example.com"
    }
    response = requests.post(f"{BASE_URL}/auth/register/", json=user_data)
    
    if response.status_code == 400 and "already exists" in str(response.json()):
        print("User already exists, logging in instead...")
        response = requests.post(f"{BASE_URL}/auth/login/", json=user_data)
    
    print(response.json())
    token = response.json().get('token')
    if not token:
        print("Failed to get token!")
        return

    headers = {"Authorization": f"Token {token}"}

    print("\n2. Creating a Room...")
    room_data = {"name": "Room 101", "capacity": 30}
    room_response = requests.post(f"{BASE_URL}/rooms/", json=room_data, headers=headers)
    if room_response.status_code == 400: # might already exist
        room_id = requests.get(f"{BASE_URL}/rooms/", headers=headers).json()[0]['id']
    else:
        room_id = room_response.json().get('id')
    print(f"Room ID: {room_id}")

    print("\n3. Creating a Course...")
    course_data = {"code": "CS101", "name": "Intro to CS"}
    course_response = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if course_response.status_code == 400:
        course_id = requests.get(f"{BASE_URL}/courses/", headers=headers).json()[0]['id']
    else:
        course_id = course_response.json().get('id')
    print(f"Course ID: {course_id}")

    print("\n4. Creating an Instructor Profile...")
    instructor_data = {"user_id": response.json()['user']['id'], "department": "Computer Science"}
    instructor_response = requests.post(f"{BASE_URL}/instructors/", json=instructor_data, headers=headers)
    if instructor_response.status_code == 400:
        instructor_id = requests.get(f"{BASE_URL}/instructors/", headers=headers).json()[0]['id']
    else:
        instructor_id = instructor_response.json().get('id')
    print(f"Instructor ID: {instructor_id}")

    print("\n5. Scheduling a Class (Monday 09:00 - 10:30)...")
    schedule_data = {
        "course": course_id,
        "room": room_id,
        "instructor": instructor_id,
        "day_of_week": "MON",
        "start_time": "09:00:00",
        "end_time": "10:30:00"
    }
    sched_response = requests.post(f"{BASE_URL}/schedules/", json=schedule_data, headers=headers)
    print("SUCCESS" if sched_response.status_code == 201 else "EXISTS")
    print(sched_response.json())

    print("\n6. Testing Collision (Scheduling another class in the same room at 10:00 - 11:00)...")
    conflict_data = {
        "course": course_id,
        "room": room_id,
        "instructor": instructor_id,
        "day_of_week": "MON",
        "start_time": "10:00:00",  # Overlaps!
        "end_time": "11:00:00"
    }
    conflict_response = requests.post(f"{BASE_URL}/schedules/", json=conflict_data, headers=headers)
    print("EXPECTED CONFLICT ERROR:")
    print(conflict_response.json())

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the server. Make sure you run 'python manage.py runserver' first!")
