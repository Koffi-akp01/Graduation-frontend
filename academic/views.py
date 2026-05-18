from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ThemeSoutenance
from django.utils import timezone

class VerifierThemeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, theme_id):
        # Vérifier que l'utilisateur a le droit
        if request.user.role not in ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC']:
            return Response(
                {'error': 'Non autorisé. Seul le service examen peut vérifier.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            theme = ThemeSoutenance.objects.get(id=theme_id)
        except ThemeSoutenance.DoesNotExist:
            return Response(
                {'error': 'Thème non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        plagiat_ok = request.data.get('verifie_plagiat', False)
        ia_ok = request.data.get('verifie_ia', False)
        commentaire = request.data.get('commentaire', '')
        
        theme.verifie_plagiat = plagiat_ok
        theme.verifie_ia = ia_ok
        theme.date_verification = timezone.now()
        theme.verifie_par = request.user
        theme.commentaire_verification = commentaire
        theme.save()
        
        # Audit trail
        from documents.models import LogEntry
        LogEntry.objects.create(
            utilisateur=request.user,
            action='VALIDATE',
            objet_type='ThemeSoutenance',
            objet_id=theme.id,
            details={
                'verifie_plagiat': plagiat_ok,
                'verifie_ia': ia_ok,
                'commentaire': commentaire
            }
        )
        
        return Response({
            'message': 'Vérification effectuée',
            'est_verifie': theme.est_verifie,
            'verifie_plagiat': theme.verifie_plagiat,
            'verifie_ia': theme.verifie_ia
        })
