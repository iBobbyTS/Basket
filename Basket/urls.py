"""Basket URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.views import static ##新增
from django.conf import settings ##新增
from django.conf.urls import url ##新增
from django.urls import path
from . import views

urlpatterns = [
    url(r'^static/(?P<path>.*)$', static.serve, {'document_root': settings.STATIC_ROOT}, name='static'),
    # Login
    path('', views.Login.login),
    path('login', views.Login.login_api),
    path('logedin', views.Login.logedin_api),
    # Change password
    path('change_password', views.ChangePassword.change_password),
    path('change_password_api', views.ChangePassword.change_password_api),
    path('reset_password_api', views.ChangePassword.reset_password_api),
    # Upload
    path('upload', views.Upload.upload),
    # Download
    path('file', views.Download.file),
    # Admin
    path('admin', views.Admin.admin),
    path('admin_info', views.Admin.admin_info_api),
    path('admin/add_course', views.Admin.add_course),
    path('admin/add_course_api', views.Admin.add_course_api),
    path('admin/add_students', views.Admin.add_students),
    path('admin/add_students_api', views.Admin.add_students_api),
    # Teacher
    path('teacher', views.Teacher.teacher),
    path('teacher_info_api', views.Teacher.teacher_info_api),
    path('teacher/add_assignment', views.Teacher.add_assignment),
    path('teacher/add_assignment_api', views.Teacher.add_assignment_api),
    path('teacher/assignment', views.Teacher.assignment),
    path('teacher/assignment_info_api', views.Teacher.assignment_info_api),
    # Student
    path('student', views.Student.student),
    path('student_info_api', views.Student.student_info_api),
    path('student/assignment', views.Student.assignment),
    path('student/assignment_info_api', views.Student.assignment_info_api),
    path('student/submit_assignment_api', views.Student.submit_assignment_api)
]
