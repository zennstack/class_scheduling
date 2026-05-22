import random
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from scheduling.models import ClassSchedule, Student, Section

_syncing = False

def generate_student_pool(required_count=100):
    first_names = [
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
        'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 
        'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 
        'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Ashley', 'Dorothy', 
        'Donald', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
    ]
    last_names = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 
        'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
    ]
    
    existing_count = Student.objects.count()
    if existing_count >= required_count:
        return
    
    needed = required_count - existing_count
    created_count = 0
    attempts = 0
    while created_count < needed and attempts < 2000:
        attempts += 1
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        student_id = f"STU{random.randint(100000, 999999)}"
        email = f"{fn.lower()}.{ln.lower()}{random.randint(10, 99)}@example.edu"
        
        if not Student.objects.filter(student_id=student_id).exists() and not Student.objects.filter(email=email).exists():
            Student.objects.create(student_id=student_id, name=name, email=email)
            created_count += 1

@receiver(post_save, sender=ClassSchedule)
def schedule_saved(sender, instance, created, **kwargs):
    # Ensure there is a pool of students
    generate_student_pool(100)
    
    # Get or create the Section object
    section, sec_created = Section.objects.get_or_create(name=instance.section)
    
    # If the section has no students, populate it with 40 random ones
    if section.students.count() < 40:
        all_students = list(Student.objects.all())
        if len(all_students) >= 40:
            assigned = random.sample(all_students, 40)
            section.students.set(assigned)
            
    # Set the schedule's students to match the section's students
    global _syncing
    if not _syncing:
        sec_student_ids = set(section.students.values_list('id', flat=True))
        inst_student_ids = set(instance.students.values_list('id', flat=True))
        if sec_student_ids != inst_student_ids:
            _syncing = True
            try:
                instance.students.set(section.students.all())
            finally:
                _syncing = False

    channel_layer = get_channel_layer()
    action = "added" if created else "updated"
    room_name = instance.room.name if instance.room else "Online"
    message = f"Schedule {action}: {instance.course.code} in {room_name} on {instance.day_of_week}"
    
    async_to_sync(channel_layer.group_send)(
        "notifications",
        {
            "type": "schedule_notification",
            "message": message,
            "action": action,
            "schedule_id": instance.id
        }
    )

@receiver(post_delete, sender=ClassSchedule)
def schedule_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    room_name = instance.room.name if instance.room else "Online"
    message = f"Schedule deleted: {instance.course.code} in {room_name} on {instance.day_of_week}"
    
    async_to_sync(channel_layer.group_send)(
        "notifications",
        {
            "type": "schedule_notification",
            "message": message,
            "action": "deleted",
            "schedule_id": instance.id
        }
    )

@receiver(m2m_changed, sender=ClassSchedule.students.through)
def sync_schedule_students(sender, instance, action, **kwargs):
    global _syncing
    if _syncing:
        return
    if action in ['post_add', 'post_remove', 'post_clear']:
        section, _ = Section.objects.get_or_create(name=instance.section)
        sec_student_ids = set(section.students.values_list('id', flat=True))
        inst_student_ids = set(instance.students.values_list('id', flat=True))
        if sec_student_ids != inst_student_ids:
            _syncing = True
            try:
                instance.students.set(section.students.all())
            finally:
                _syncing = False

@receiver(m2m_changed, sender=Section.students.through)
def sync_section_students(sender, instance, action, **kwargs):
    global _syncing
    if _syncing:
        return
    if action in ['post_add', 'post_remove', 'post_clear']:
        _syncing = True
        try:
            schedules = ClassSchedule.objects.filter(section=instance.name)
            sec_students = list(instance.students.all())
            sec_student_ids = set(instance.students.values_list('id', flat=True))
            for sched in schedules:
                sched_student_ids = set(sched.students.values_list('id', flat=True))
                if sched_student_ids != sec_student_ids:
                    sched.students.set(sec_students)
        finally:
            _syncing = False
