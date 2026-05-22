
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import uuid

# UserProfile for email verification
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email_verification_token = models.CharField(max_length=64, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)

    def generate_verification_token(self):
        self.email_verification_token = uuid.uuid4().hex
        self.save()

    def __str__(self):
        return f"Profile for {self.user.username}"

class Room(models.Model):
    name = models.CharField(max_length=50, unique=True)
    capacity = models.IntegerField(default=30)

    def __str__(self):
        return self.name

class Instructor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, default='New Instructor')
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.student_id} - {self.name}"

class Section(models.Model):
    name = models.CharField(max_length=50, unique=True)
    students = models.ManyToManyField(Student, related_name='sections', blank=True)

    def __str__(self):
        return self.name

class ClassSchedule(models.Model):
    DAYS_OF_WEEK = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    ]

    CLASS_TYPES = [
        ('LECTURE', 'Lecture'),
        ('ONLINE', 'Online'),
    ]

    SECTION_CHOICES = [
        ('IT3R1', 'IT3R1'),
        ('IT3R2', 'IT3R2'),
        ('IT3R3', 'IT3R3'),
        ('IT3R4', 'IT3R4'),
        ('IT3R5', 'IT3R5'),
        ('IT3R6', 'IT3R6'),
        ('IT3R7', 'IT3R7'),
        ('IT3R8', 'IT3R8'),
        ('IT3R9', 'IT3R9'),
        ('IT3R10', 'IT3R10'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=3, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    class_type = models.CharField(max_length=10, choices=CLASS_TYPES, default='LECTURE')
    section = models.CharField(max_length=10, choices=SECTION_CHOICES, default='IT3R1')
    students = models.ManyToManyField(Student, related_name='schedules', blank=True)

    class Meta:
        verbose_name_plural = "Class Schedules"

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})

        if self.class_type == 'LECTURE' and not self.room:
            raise ValidationError({'room': 'Room is required for Lecture classes.'})

        if not all([self.day_of_week, self.start_time, self.end_time, self.instructor]):
            return

        # Check for room conflict
        if self.room:
            room_conflicts = ClassSchedule.objects.filter(
                room=self.room,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            )
            if self.pk:
                room_conflicts = room_conflicts.exclude(pk=self.pk)

            if room_conflicts.exists():
                raise ValidationError({
                    'room': f"Room {self.room.name} is already booked for another class during this time slot."
                })

        # Check for instructor conflict
        instructor_conflicts = ClassSchedule.objects.filter(
            instructor=self.instructor,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        )
        if self.pk:
            instructor_conflicts = instructor_conflicts.exclude(pk=self.pk)

        if instructor_conflicts.exists():
            raise ValidationError({
                'instructor': f"Instructor {self.instructor.name} is already assigned to another class during this time slot."
            })

    def __str__(self):
        room_name = self.room.name if self.room else "Online"
        return f"{self.course.code} in {room_name} on {self.day_of_week} ({self.start_time} - {self.end_time})"

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
