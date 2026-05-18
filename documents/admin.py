from django.contrib import admin
from .models import Memoire, ProcesVerbal, Attestation, Document, LogEntry

admin.site.register(Memoire)
admin.site.register(ProcesVerbal)
admin.site.register(Attestation)
admin.site.register(Document)
admin.site.register(LogEntry)

