from rest_framework import serializers
from .models import Memoire, ProcesVerbal, Attestation, Document, Memoire
from drf_spectacular.utils import extend_schema_field


@extend_schema_field(serializers.CharField())
def get_full_name(self, obj):
    return f"{obj.user.first_name} {obj.user.last_name}"
class MemoireSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.ReadOnlyField(source='etudiant.user.get_full_name')
    filiere_nom = serializers.ReadOnlyField(source='etudiant.filiere.nom')

    class Meta:
        model = Memoire
        fields = [
            'id', 'etudiant', 'etudiant_nom', 'filiere_nom', 'titre_final', 
            'fichier_pdf', 'fichier_word', 'support_presentation', 
            'est_valide_par_directeur', 'verifie_anti_plagiat', 
            'score_similarite', 'nb_pages', 'date_depot'
        ]
        # L'étudiant ne peut pas valider lui-même son mémoire ou son score anti-plagiat
        read_only_fields = [
            'etudiant', 'est_valide_par_directeur', 
            'verifie_anti_plagiat', 'score_similarite'
        ]

    def validate_nb_pages(self, value):
        """Vérification simple des limites du cahier des charges"""
        # Note : On pourra affiner selon si c'est Licence ou Master dans la Vue
        if value > 125:
            raise serializers.ValidationError("Le volume du manuscrit dépasse les limites autorisées par l'IPNET.")
        return value

class ProcesVerbalSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.ReadOnlyField(source='soutenance.etudiant.user.get_full_name')
    session = serializers.ReadOnlyField(source='soutenance.get_session_display')

    class Meta:
        model = ProcesVerbal
        fields = [
            'id', 'soutenance', 'etudiant_nom', 'session', 'fichier_pv', 
            'code_archive', 'signe_par_president', 'signe_par_examinateur', 
            'signe_par_directeur', 'date_generation'
        ]
        read_only_fields = ['fichier_pv', 'code_archive', 'date_generation']

class AttestationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attestation
        fields = '__all__'

# documents/serializers.py


class MemoireVerificationSerializer(serializers.Serializer):
    verifie_anti_plagiat = serializers.BooleanField(required=True)
    score_similarite = serializers.FloatField(required=False, min_value=0, max_value=100, default=0.0)
    commentaire = serializers.CharField(required=False, allow_blank=True)

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'type_document', 'fichier', 'version', 'est_valide', 'commentaire', 'date_upload']
        read_only_fields = ['id', 'version', 'est_valide', 'date_upload']