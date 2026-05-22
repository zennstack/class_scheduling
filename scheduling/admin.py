from django.contrib import admin
from .models import Room, Instructor, Course, ClassSchedule, UserProfile, Student

admin.site.register(Room)
admin.site.register(Instructor)
admin.site.register(Course)
admin.site.register(ClassSchedule)
admin.site.register(UserProfile)
admin.site.register(Student)
