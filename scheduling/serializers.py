from rest_framework import serializers
from .models import Soutenance, Salle, Evaluation, Indisponibilite
from rest_framework import serializers


class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = ['id', 'nom', 'capacite', 'equipements', 'est_disponible']

class SoutenanceSerializer(serializers.ModelSerializer):
    # Affichage des noms au lieu des simples IDs pour le frontend
    etudiant_details = serializers.ReadOnlyField(source='etudiant.user.get_full_name')
    filiere = serializers.ReadOnlyField(source='etudiant.filiere.nom')
    salle_nom = serializers.ReadOnlyField(source='salle.nom')
    
    # Détails du Jury
    president_nom = serializers.ReadOnlyField(source='president.get_full_name')
    examinateur_nom = serializers.ReadOnlyField(source='examinateur.get_full_name')
    directeur_nom = serializers.ReadOnlyField(source='directeur_memoire.get_full_name')

    class Meta:
        model = Soutenance
        fields = [
            'id', 'etudiant', 'etudiant_details', 'filiere', 'theme', 
            'salle', 'salle_nom', 'date_soutenance', 'session', 
            'president', 'president_nom', 'examinateur', 'examinateur_nom', 
            'directeur_memoire', 'directeur_nom', 'pre_soutenance_validee', 
            'est_cloturee', 'lien_meet'
        ]



class EvaluationSerializer(serializers.ModelSerializer):
    note_finale = serializers.FloatField(read_only=True)
    mention = serializers.CharField(read_only=True)
    
    class Meta:
        model = Evaluation
        fields = '__all__'
        read_only_fields = ['id', 'note_finale', 'mention', 'pv_genere', 'est_signe_par_tous']
        extra_kwargs = {
            'note_presentation': {'min_value': 0, 'max_value': 20},
            'note_maitrise': {'min_value': 0, 'max_value': 20},
            'note_memoire': {'min_value': 0, 'max_value': 20},
            'note_reponses': {'min_value': 0, 'max_value': 20},
        }
    
    def update(self, instance, validated_data):
        # Mise à jour des notes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Recalculer la mention automatiquement
        instance.mention = self.calculer_mention(instance.note_finale)
        instance.save()
        return instance
    
    @staticmethod
    def calculer_mention(note):
        if note >= 16:
            return "Très bien"
        elif note >= 14:
            return "Bien"
        elif note >= 12:
            return "Assez bien"
        elif note >= 10:
            return "Passable"
        else:
            return "Non admis"

class IndisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indisponibilite
        fields = '__all__'
        read_only_fields = ['id']