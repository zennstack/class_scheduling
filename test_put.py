import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ClassScheduling.settings")
django.setup()

from scheduling.serializers import ClassScheduleSerializer
from scheduling.models import Course, Instructor, Room, ClassSchedule

# Get an existing schedule
schedule = ClassSchedule.objects.first()
if not schedule:
    print("No schedule found to update")
    exit()

print(f"Current schedule room: {schedule.room}, class_type: {schedule.class_type}")

data = {
    'course': schedule.course.id,
    'instructor': schedule.instructor.id,
    'day_of_week': 'TUE',
    'start_time': '10:00',
    'end_time': '11:00',
    'class_type': 'ONLINE',
    'room': None
}

serializer = ClassScheduleSerializer(instance=schedule, data=data, partial=False)
if not serializer.is_valid():
    print("Validation failed:")
    print(serializer.errors)
else:
    print("Valid update!")
