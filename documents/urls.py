# documents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemoireViewSet, UploadMemoireView, VerifierMemoireView

router = DefaultRouter()
router.register('memoires', MemoireViewSet, basename='memoire')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', UploadMemoireView.as_view(), name='upload-document'),
    path('memoires/<int:memoire_id>/verifier/', VerifierMemoireView.as_view(), name='verifier-memoire'),
]