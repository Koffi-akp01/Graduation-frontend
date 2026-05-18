from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_doctor', 'is_internal']
        read_only_fields = ['id', 'role'] # On ne change pas son rôle soi-même

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # On ajoute le rôle dans le token lui-même (facultatif mais pratique)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # ICI : On ajoute le rôle dans la réponse JSON
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data