import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ClassScheduling.settings")
django.setup()

from scheduling.serializers import ClassScheduleSerializer
from scheduling.models import Course, Instructor, Room

# Get a course and instructor
course = Course.objects.first()
instructor = Instructor.objects.first()

data = {
    'course': course.id if course else 1,
    'instructor': instructor.id if instructor else 1,
    'day_of_week': 'MON',
    'start_time': '08:00',
    'end_time': '09:00',
    'class_type': 'ONLINE',
    'room': None
}

serializer = ClassScheduleSerializer(data=data)
if not serializer.is_valid():
    print(serializer.errors)
else:
    print("Valid!")
