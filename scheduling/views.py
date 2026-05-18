from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Avg
from django.db import models as django_models
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.http import FileResponse, Http404
from datetime import timedelta
import os
from accounts.permissions import IsDirectionAcademique, IsDirectionOrOrganisation
from .models import Soutenance, Indisponibilite, Salle, Evaluation
from .serializers import SoutenanceSerializer, SalleSerializer, IndisponibiliteSerializer, EvaluationSerializer
from .permissions import EstMembreJury, PeutValiderEvaluation
from rest_framework import viewsets, serializers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils.dateparse import parse_datetime
from datetime import timedelta

from .models import Soutenance, Salle, Evaluation
from .serializers import SoutenanceSerializer, SalleSerializer
from accounts.permissions import IsDirectionOrOrganisation, IsDirectionAcademique


from documents.models import LogEntry
from .utils import generer_proces_verbal


# =========================
# SOUTENANCE
# =========================
class SoutenanceViewSet(viewsets.ModelViewSet):
    serializer_class = SoutenanceSerializer
    queryset = Soutenance.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsDirectionOrOrganisation]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Soutenance.objects.filter(etudiant__user=user)
        if user.role == 'PRESIDENT_JURY':
            return Soutenance.objects.filter(president=user)
        if user.role == 'EXAMINER':
            return Soutenance.objects.filter(examinateur=user)
        if user.role in ['INTERNAL_TRAINER', 'EXTERNAL_TRAINER']:
            return Soutenance.objects.filter(directeur_memoire=user)
        if user.role in ['ADMIN_ACADEMIC', 'CHARGE_ORGANISATION']:
            return Soutenance.objects.all()
        return Soutenance.objects.none()

    def perform_create(self, serializer):
        student = serializer.validated_data['etudiant']
        erreurs = student.verifier_conformite_dossier()

        if erreurs:
            raise serializers.ValidationError({"blocage": erreurs})

        serializer.save()

    @action(detail=False, methods=['get'])
    def salles_disponibles(self, request):
        date_voulue = request.query_params.get('date')
        debut = request.query_params.get('debut')
        fin = request.query_params.get('fin')

        if debut and fin:
            debut_dt = parse_datetime(debut)
            fin_dt = parse_datetime(fin)

            if not debut_dt or not fin_dt:
                raise serializers.ValidationError({
                    "creneau": "Les parametres 'debut' et 'fin' doivent etre des datetime ISO valides."
                })

            if debut_dt > fin_dt:
                raise serializers.ValidationError({
                    "creneau": "Le parametre 'debut' doit etre inferieur ou egal a 'fin'."
                })

            salles_occupees = Soutenance.objects.filter(
                date_soutenance__range=(debut_dt, fin_dt)
            ).values_list('salle_id', flat=True)
        else:
            date_voulue_dt = parse_datetime(date_voulue) if date_voulue else None

            if not date_voulue_dt:
                raise serializers.ValidationError({
                    "date": "Le parametre 'date' doit etre un datetime ISO valide, ou utilisez 'debut' et 'fin'."
                })

            start_time = date_voulue_dt - timedelta(minutes=59)
            end_time = date_voulue_dt + timedelta(minutes=59)

            salles_occupees = Soutenance.objects.filter(
                date_soutenance__range=(start_time, end_time)
            ).values_list('salle_id', flat=True)

        disponibles = Salle.objects.exclude(id__in=salles_occupees)

        serializer = SalleSerializer(disponibles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsDirectionAcademique])
    def statistiques_session(self, request):
        stats = {
            "total_soutenances": Soutenance.objects.count(),
            "soutenances_cloturees": Soutenance.objects.filter(est_cloturee=True).count(),
            "moyenne_generale": Evaluation.objects.aggregate(Avg('note_maitrise'))['note_maitrise__avg'],
            "repartition_mentions": list(
                Evaluation.objects.values('mention').annotate(nombre=Count('mention'))
            )
        }
        return Response(stats)




# =========================
# SALLE
# =========================
class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer


# =========================
# INDISPONIBILITE
# =========================
class IndisponibiliteViewSet(viewsets.ModelViewSet):
    queryset = Indisponibilite.objects.all()
    serializer_class = IndisponibiliteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'STUDENT':
            return Indisponibilite.objects.none()

        if role in ['EXAMINER', 'PRESIDENT_JURY', 'DIRECTOR']:
            return Indisponibilite.objects.filter(
                django_models.Q(utilisateur=user) | django_models.Q(salle__isnull=False)
            )

        return super().get_queryset()

    def perform_create(self, serializer):
        if self.request.user.role == 'EXAMINER':
            serializer.save(utilisateur=self.request.user)
        else:
            serializer.save()


# =========================
# EVALUATION
# =========================
class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), EstMembreJury()]
        if self.action == 'valider':
            return [permissions.IsAuthenticated(), PeutValiderEvaluation()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        evaluation = serializer.save()

        LogEntry.objects.create(
            utilisateur=self.request.user,
            action='UPDATE',
            objet_type='Evaluation',
            objet_id=evaluation.id,
            details={'notes': serializer.validated_data}
        )

    @action(detail=True, methods=['post'], url_path='valider')
    def valider(self, request, pk=None):
        evaluation = self.get_object()

        if evaluation.est_signe_par_tous:
            return Response({'detail': 'Déjà validée'}, status=400)

        champs = ['note_presentation', 'note_maitrise', 'note_memoire', 'note_reponses']
        if any(getattr(evaluation, c) is None for c in champs):
            return Response({'detail': 'Notes incomplètes'}, status=400)

        evaluation.est_signe_par_tous = True
        evaluation.save()

        generer_proces_verbal(evaluation)

        LogEntry.objects.create(
            utilisateur=request.user,
            action='VALIDATE',
            objet_type='Evaluation',
            objet_id=evaluation.id,
            details={'validation': 'PV généré'}
        )

        return Response({'message': 'Validé'}, status=200)

    @action(detail=True, methods=['get'], url_path='telecharger-pv')
    def telecharger_pv(self, request, pk=None):
        evaluation = self.get_object()

        if not evaluation.pv_genere:
            generer_proces_verbal(evaluation)

        if not evaluation.pv_genere or not os.path.exists(evaluation.pv_genere.path):
            raise Http404()

        return FileResponse(
            open(evaluation.pv_genere.path, 'rb'),
            as_attachment=True,
            filename=os.path.basename(evaluation.pv_genere.name)
        )
