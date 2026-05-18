from rest_framework import permissions

class EstMembreJury(permissions.BasePermission):
    """Autorise les membres du jury liés à la soutenance à modifier les notes."""
    def has_object_permission(self, request, view, obj):
        # obj est une instance de Evaluation
        soutenance = obj.soutenance
        user = request.user
        # Vérifie si l'utilisateur fait partie du jury
        return user in [soutenance.president, soutenance.examinateur, soutenance.directeur_memoire]

class EstPresidentJury(permissions.BasePermission):
    """Autorise uniquement le président à valider l'évaluation."""
    def has_object_permission(self, request, view, obj):
        return obj.soutenance.president == request.user

class PeutValiderEvaluation(permissions.BasePermission):
    """Permission combinée : président ET que toutes les notes soient saisies."""
    def has_object_permission(self, request, view, obj):
        # Vérifie d'abord que c'est le président
        if obj.soutenance.president != request.user:
            return False
        # Vérifie que toutes les notes sont renseignées (non nulles)
        return all([
            obj.note_presentation is not None,
            obj.note_maitrise is not None,
            obj.note_memoire is not None,
            obj.note_reponses is not None,
        ])