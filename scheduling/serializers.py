from rest_framework import serializers
from .models import Room, Instructor, Course, ClassSchedule
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class InstructorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = Instructor
        fields = ['id', 'user', 'user_id', 'department']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = '__all__'

    def validate(self, data):
        # We can run the model's clean method here to trigger our custom validation
        instance = ClassSchedule(**data)
        try:
            instance.clean()
        except serializers.ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['room'] = RoomSerializer(instance.room).data
        representation['instructor'] = InstructorSerializer(instance.instructor).data
        representation['course'] = CourseSerializer(instance.course).data
        return representation
