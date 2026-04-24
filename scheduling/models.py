from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Room(models.Model):
    name = models.CharField(max_length=50, unique=True)
    capacity = models.IntegerField(default=30)

    def __str__(self):
        return self.name

class Instructor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.code} - {self.name}"

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

    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=3, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name_plural = "Class Schedules"

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})

        if not self.room_id or not self.day_of_week or not self.start_time or not self.end_time or not self.instructor_id:
            return

        # Check for room conflict
        room_conflicts = ClassSchedule.objects.filter(
            room=self.room,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)

        if room_conflicts.exists():
            raise ValidationError({'room': f"Room {self.room.name} is already booked during this time."})

        # Check for instructor conflict
        instructor_conflicts = ClassSchedule.objects.filter(
            instructor=self.instructor,
            day_of_week=self.day_of_week,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        ).exclude(pk=self.pk)

        if instructor_conflicts.exists():
            raise ValidationError({'instructor': f"Instructor {self.instructor} is already teaching during this time."})

    def __str__(self):
        return f"{self.course.code} in {self.room.name} on {self.day_of_week} ({self.start_time} - {self.end_time})"

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
