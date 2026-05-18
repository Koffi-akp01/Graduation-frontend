from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """Acces reserve aux etudiants"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'


class IsServiceExamen(permissions.BasePermission):
    """Acces reserve au Chef Service Examen"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CHEF_SERVICE_EXAM'


class IsRecouvrement(permissions.BasePermission):
    """Acces reserve au Service de Recouvrement"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SERVICE_RECOUVREMENT'


class IsDirectionAcademique(permissions.BasePermission):
    """Acces reserve a la Direction Academique"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN_ACADEMIC'


class IsChargeOrganisation(permissions.BasePermission):
    """Acces reserve au charge d'organisation"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CHARGE_ORGANISATION'


class IsStudentOrServiceExamen(permissions.BasePermission):
    """Acces reserve aux etudiants ou au Chef Service Examen"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['STUDENT', 'CHEF_SERVICE_EXAM']
        )


class IsDirectionOrOrganisation(permissions.BasePermission):
    """Acces reserve a la Direction Academique ou au charge d'organisation"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['ADMIN_ACADEMIC', 'CHARGE_ORGANISATION']
        )
