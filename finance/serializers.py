from rest_framework import serializers
from .models import Bordereau
from drf_spectacular.utils import extend_schema_field


@extend_schema_field(serializers.CharField())
def get_full_name(self, obj):
    return f"{obj.user.first_name} {obj.user.last_name}"

class BordereauSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.ReadOnlyField(source='etudiant.user.get_full_name')
    
    class Meta:
        model = Bordereau
        fields = [
            'id', 'etudiant', 'etudiant_nom', 'numero_bordereau', 
            'banque', 'montant', 'image_bordereau', 'est_valide', 
            'date_depot'
        ]
        read_only_fields = ['est_valide', 'etudiant']

    def validate_montant(self, value):
        if value not in [100000, 150000]:
            raise serializers.ValidationError("Le montant doit être de 100.000 F (Licence) ou 150.000 F (Master).")
        return value