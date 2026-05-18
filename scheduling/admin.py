from django.contrib import admin
from .models import Salle, Soutenance, Indisponibilite, Evaluation

admin.site.register(Salle)
admin.site.register(Indisponibilite)
admin.site.register(Evaluation)

@admin.register(Soutenance)
class SoutenanceAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'date_soutenance', 'salle', 'pre_soutenance_validee')
    list_filter = ('session', 'est_cloturee')
    search_fields = ('etudiant__user__last_name', 'etudiant__matricule')