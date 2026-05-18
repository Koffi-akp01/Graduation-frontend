
from rest_framework import viewsets, permissions, parsers, serializers, status

from rest_framework import viewsets, parsers
from .models import Memoire, Document, LogEntry
from .serializers import MemoireSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from drf_spectacular.utils import extend_schema, OpenApiResponse
from django.utils import timezone

from .models import Memoire, Document, LogEntry
from .serializers import (
    MemoireSerializer,
    DocumentSerializer,
    MemoireVerificationSerializer
)

from academic.models import StudentProfile
from accounts.permissions import IsStudent, IsStudentOrServiceExamen

class MemoireViewSet(viewsets.ModelViewSet):
    serializer_class = MemoireSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_permissions(self):
        if self.action == 'create':
            return [IsStudent()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsStudentOrServiceExamen()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'STUDENT':
            return Memoire.objects.filter(etudiant__user=user)
        if user.role in ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC']:
            return Memoire.objects.all()

        return Memoire.objects.none()

    def perform_create(self, serializer):
        student = StudentProfile.objects.get(user=self.request.user)
        serializer.save(etudiant=student)

class UploadMemoireView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != 'STUDENT':
            return Response({'error': 'Seuls les étudiants peuvent uploader'}, status=403)

        student = StudentProfile.objects.get(user=request.user)

        type_doc = request.data.get('type_document', 'memoire')

        last_doc = Document.objects.filter(
            etudiant=student,
            type_document=type_doc
        ).order_by('-version').first()

        next_version = (last_doc.version + 1) if last_doc else 1

        document = Document.objects.create(
            etudiant=student,
            type_document=type_doc,
            fichier=request.data.get('fichier'),
            version=next_version
        )

        LogEntry.objects.create(
            utilisateur=request.user,
            action='UPLOAD',
            objet_type='Document',
            objet_id=document.id,
            details={'version': next_version}
        )

        return Response(DocumentSerializer(document).data, status=201)
    
class VerifierMemoireView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, memoire_id):
        allowed_roles = ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC']

        if not hasattr(request.user, 'role') or request.user.role not in allowed_roles:
            return Response({'error': 'Non autorisé'}, status=403)

        try:
            memoire = Memoire.objects.get(id=memoire_id)
        except Memoire.DoesNotExist:
            return Response({'error': 'Mémoire introuvable'}, status=404)

        serializer = MemoireVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        memoire.verifie_anti_plagiat = data['verifie_anti_plagiat']
        memoire.score_similarite = data.get('score_similarite', 0.0)
        memoire.save()

        LogEntry.objects.create(
            utilisateur=request.user,
            action='VALIDATE',
            objet_type='Memoire',
            objet_id=memoire.id,
            details=data
        )

        return Response({
            'message': 'Mémoire vérifié',
            'score': memoire.score_similarite
        }, status=200)

