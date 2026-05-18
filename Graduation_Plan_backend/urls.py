from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from accounts.views import UserViewSet, MyTokenObtainPairView
# from academic.views import ThemeViewSet          # commenté car pas encore implémenté
# from scheduling.views import SoutenanceViewSet, SalleViewSet   # commenté si inexistants
from documents.views import MemoireViewSet
from finance.views import BordereauViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
# router.register(r'themes', ThemeViewSet, basename='theme')
# router.register(r'soutenances', SoutenanceViewSet, basename='soutenance')  # si implémenté plus tard
# router.register(r'salles', SalleViewSet, basename='salle')
router.register(r'bordereaux', BordereauViewSet, basename='bordereau')
router.register(r'memoires', MemoireViewSet, basename='memoire')



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/documents/', include('documents.urls')),
    path('api/scheduling/', include('scheduling.urls')),   # contient indisponibilités, évaluations
    path('api/academic/', include('academic.urls')),   
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)







