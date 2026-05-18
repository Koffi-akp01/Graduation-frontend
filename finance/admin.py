from django.contrib import admin
from .models import Bordereau

@admin.register(Bordereau)
class BordereauAdmin(admin.ModelAdmin):
    list_display = ('numero_bordereau', 'etudiant', 'montant', 'est_valide', 'date_depot', 'date_validation')
    list_filter = ('est_valide', 'banque', 'montant')
    search_fields = ('numero_bordereau', 'etudiant__user__last_name', 'etudiant__matricule')
    readonly_fields = ('date_depot',)
    fields = ('numero_bordereau', 'etudiant', 'banque', 'montant', 'image_bordereau', 'est_valide', 'valide_par', 'date_validation')