from rest_framework import viewsets, permissions

from .models import Bordereau
from .serializers import BordereauSerializer
from accounts.permissions import IsRecouvrement, IsStudent
from academic.models import StudentProfile
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import serializers


lookup_value_regex = r'\d+'
@extend_schema(
    request=serializers.Serializer,  # pas de sérialiseur spécifique
    responses={
        201: OpenApiResponse(description="Fichier uploadé avec succès"),
        400: OpenApiResponse(description="Requête invalide"),
        403: OpenApiResponse(description="Non autorisé"),
        404: OpenApiResponse(description="Étudiant non trouvé"),
    }
)
class BordereauViewSet(viewsets.ModelViewSet):
    serializer_class = BordereauSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsStudent]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsRecouvrement]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SERVICE_RECOUVREMENT', 'ADMIN_ACADEMIC']:
            return Bordereau.objects.all()
        if user.role == 'STUDENT':
            return Bordereau.objects.filter(etudiant__user=user)
        return Bordereau.objects.none()

    def perform_create(self, serializer):
        student = StudentProfile.objects.get(user=self.request.user)
        serializer.save(etudiant=student)
