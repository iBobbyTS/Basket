import time
import datetime
from django.http import JsonResponse, FileResponse
from django.shortcuts import render, redirect
import sqlite3
from . import utils
conn = sqlite3.connect('db.sqlite3', check_same_thread=False)
c = conn.cursor()


def verify_type(cookie: str, supposed_type: int):
    decoded_username = utils.decode_cookie(cookie)[1]
    fetch = c.execute(f"SELECT Type FROM 'Accounts' WHERE \"Username\" = '{decoded_username}';").fetchall()
    if not fetch:
        return False
    return fetch[0][0] == supposed_type


def verify_cookie(request, supposed_type: int):
    try:
        cookie = utils.parse_cookie(request.headers['Cookie'])['TOKEN']
    except KeyError:
        return False
    if not verify_type(cookie, supposed_type):
        return False
    return True


class Login:
    @staticmethod
    def login(request):
        return render(request, '../templates/index.html')

    @staticmethod
    def login_api(request):
        assert request.method == 'POST'
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        username = request_body['u']
        sha1pwd = request_body['p']
        fetch = c.execute(f"SELECT * FROM 'Accounts' WHERE \"Username\" = '{username}';").fetchall()
        if not fetch:
            return JsonResponse({'success': 1})
        fetch = fetch[0]
        if fetch[2] != sha1pwd:
            return JsonResponse({'success': 2})
        usertype = utils.user_type_dict[fetch[1]]
        current_time = datetime.datetime.utcnow()  # 当前时间
        current_time = current_time + datetime.timedelta(seconds=5)
        req = redirect(f'/{usertype}')
        req.set_cookie('TOKEN', utils.encode_cookie(username), expires=current_time)
        req.set_cookie('USERNAME', username, expires=current_time)
        return JsonResponse({
            'success': 0,
            'usertype': usertype,
            'token': utils.encode_cookie(username),
            'username': username
        })
        # success: {1: User_not_found, 2: Password_incorrect}

    @staticmethod
    def logedin_api(request):
        assert request.method == 'POST'
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        cookie = request_body['c']
        username = request_body['u']
        valid, decoded_username = utils.decode_cookie(cookie)
        if valid and (username == decoded_username):
            return JsonResponse({'valid': 1})
        else:
            return JsonResponse({'valid': 0})


class ChangePassword:
    @staticmethod
    def change_password(request):
        return render(request, '../templates/change_password.html')

    @staticmethod
    def change_password_api(request):
        assert request.method == 'POST'
        try:
            cookie = utils.parse_cookie(request.headers['Cookie'])['TOKEN']
            decoded_username = utils.decode_cookie(cookie)[1]
        except KeyError:
            return JsonResponse({'success': 0})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        current_password_sha = request_body['c']
        new_password_sha = request_body['n']
        username_fetch = c.execute(f"SELECT SHA1Password FROM 'Accounts' WHERE \"Username\" = '{decoded_username}';").fetchall()
        if not username_fetch:
            return JsonResponse({'success': 1})
        if current_password_sha != username_fetch[0][0]:
            return JsonResponse({'success': 1})
        c.execute(f"UPDATE Accounts SET SHA1Password = '{new_password_sha}' WHERE Username = '{decoded_username}';")
        conn.commit()
        return JsonResponse({'success': 0})

    @staticmethod
    def reset_password_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 0):
            return JsonResponse({'success': 1})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        password_sha = request_body['p']
        username = request_body['u']
        c.execute(f"UPDATE Accounts SET SHA1Password = '{password_sha}' WHERE Username = '{username}';")
        conn.commit()
        return JsonResponse({'success': 0})


class Upload:
    @staticmethod
    def upload(request):
        assert request.method == 'POST'
        rtn = {'success': 1, 'file': []}
        for obj in request.FILES.getlist('files'):
            uuid = utils.generate_uuid()
            rtn['file'].append((obj.name, uuid))
            with open('files/' + uuid, 'wb') as f:
                for chunk in obj.chunks():
                    f.write(chunk)
        rtn['success'] = 0
        return JsonResponse(rtn)


class Download:
    @staticmethod
    def file(request):
        uuid = request.GET['uuid']
        file_name = c.execute(f"SELECT FileName FROM Files WHERE UUID = '{uuid}'").fetchall()[0][0]
        file = open(f'files/{uuid}', 'rb')
        response = FileResponse(file, filename=file_name)
        return response


class Admin:
    @staticmethod
    def admin(request):
        return render(request, '../templates/admin/admin.html')

    @staticmethod
    def admin_info_api(request):
        assert request.method == 'GET'
        if not verify_cookie(request, 0):
            return JsonResponse({'success': 1})
        courses = c.execute(f"SELECT CourseName,TeacherName FROM Courses;").fetchall()
        students = c.execute(f"SELECT Username,Type FROM 'Accounts' WHERE \"Type\" = '2';").fetchall()
        return JsonResponse({
            'success': 0,
            'courses': tuple(courses),
            'students': tuple(students)
        })

    @staticmethod
    def add_course(request):
        return render(request, '../templates/admin/add_course.html')

    @staticmethod
    def add_course_api(request):
        assert request.method == 'POST'
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        if not verify_cookie(request, 0):
            return JsonResponse({'success': 0})
        course_name = request_body['c']
        teacher_name = request_body['t']
        pwd_sha = request_body['p']
        c.execute(f"INSERT INTO Accounts VALUES ('{teacher_name}', 1, '{pwd_sha}');")
        c.execute(f"INSERT INTO Courses VALUES ('{course_name}', '{teacher_name}');")
        conn.commit()
        return JsonResponse({'success': 1})

    @staticmethod
    def add_students(request):
        return render(request, '../templates/admin/add_students.html')

    @staticmethod
    def add_students_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 0):
            return JsonResponse({'success': 0})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        request_body['s'] = request_body['s'].split(',')
        request_body['p'] = request_body['p'].split(',')
        student_names = request_body['s']
        pwd_shas = request_body['p']
        records = ','.join([f"('{student_name}', 2, '{pwd_sha}')" for student_name, pwd_sha in zip(student_names, pwd_shas)])
        c.execute(f"INSERT INTO Accounts VALUES {records};")
        conn.commit()
        return JsonResponse({'success': 1})


class Teacher:
    @staticmethod
    def teacher(request):
        return render(request, '../templates/teacher/teacher.html')

    @staticmethod
    def teacher_info_api(request):
        if not verify_cookie(request, 1):
            return JsonResponse({'success': 1})
        try:
            cookie = utils.parse_cookie(request.headers['Cookie'])['TOKEN']
            decoded_username = utils.decode_cookie(cookie)[1]
        except KeyError:
            return JsonResponse({'success': 1})
        teacher_name = c.execute(f"SELECT CourseName FROM Courses WHERE TeacherName = '{decoded_username}';").fetchall()[0][0]
        assignments = c.execute(
            "SELECT Name,Requirement,UUID FROM AssignmentT WHERE CourseName = "
            f"'{teacher_name}' ORDER BY AssignDate DESC;").fetchall()
        return JsonResponse({'success': 0, 'assignments': assignments})

    @staticmethod
    def add_assignment(request):
        return render(request, '../templates/teacher/add_assignment.html')

    @staticmethod
    def add_assignment_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 1):
            return JsonResponse({'success': 1})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        uuid = utils.generate_uuid()
        assignment_name = utils.string_escape(request_body['n'])
        course_name = c.execute(
            "SELECT CourseName FROM Courses WHERE TeacherName = '"
            f"{utils.decode_cookie(utils.parse_cookie(request.headers['Cookie'])['TOKEN'])[1]}';"
        ).fetchall()[0][0]
        requirements = utils.string_escape(request_body['r'])
        submit_text = request_body['st']
        submit_file = request_body['sf']
        submit_tf = int(str(submit_text)+str(submit_file), base=2)
        files = eval(request_body['f'])
        assign_date = int(time.time())
        due_date = request_body['t']
        [c.execute(f"INSERT INTO Files VALUES ('{uuid_}', '{file_name}')") for uuid_, file_name in files.items()]
        c.execute(
            "INSERT INTO AssignmentT VALUES ("
            f"'{uuid}', '{assignment_name}', '{course_name}', '{requirements}', "
            f"'{','.join(files.keys())}', {submit_tf}, {assign_date}, {due_date}"
            ");"
        )
        conn.commit()
        return JsonResponse({'success': 0})

    @staticmethod
    def assignment(request):
        return render(request, '../templates/teacher/assignment.html')

    @staticmethod
    def assignment_info_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 1):
            return JsonResponse({'success': 1})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        uuid = request_body['uuid']
        assignment = c.execute(
            f"SELECT Name,Requirement,FileUUID,DueDate FROM AssignmentT WHERE UUID = '{uuid}';"
        ).fetchall()[0]
        name = assignment[0]
        requirement = utils.string_escape(assignment[1])
        file_uuids = assignment[2].split(',')
        file_names = c.execute(' UNION '.join([f"SELECT FileName FROM Files WHERE UUID = '{f_uuid}'" for f_uuid in file_uuids]) + ';')
        file_dict = {k: v[0] for k, v in zip(file_uuids, file_names)}
        due_date = assignment[3]
        submitted = c.execute(f"SELECT StudentName,Text,SubmissionDate,FileUUID FROM AssignmentS WHERE AssignmentUUID = '{uuid}' ORDER BY SubmissionDate DESC").fetchall()
        new_submitted = []
        for i in submitted:
            new_submitted.append(list(i))
            submitted_file_uuids = new_submitted[-1][3].split(',')
            submitted_file_names = c.execute(' UNION '.join([f"SELECT FileName FROM Files WHERE UUID = '{f_uuid}'" for f_uuid in submitted_file_uuids]) + ';').fetchall()
            submitted_file_dict = {k: v[0] for k, v in zip(submitted_file_uuids, submitted_file_names)}
            new_submitted[-1][-1] = submitted_file_dict
        return JsonResponse({
            'success': 0,
            'name': name, 'requirement': requirement,
            'file_dict': file_dict, 'due_date': due_date,
            'submission': new_submitted
        })


class Student:
    @staticmethod
    def student(request):
        return render(request, '../templates/student/student.html')

    @staticmethod
    def student_info_api(request):
        assignments = c.execute(
            "SELECT Name,Requirement,UUID,CourseName,DueDate FROM AssignmentT ORDER BY AssignDate DESC;"
        ).fetchall()
        courses = [i[0] for i in c.execute("SELECT CourseName FROM Courses;").fetchall()]
        return JsonResponse({'success': 0, 'courses': courses, 'assignments': assignments})

    @staticmethod
    def assignment(request):
        return render(request, '../templates/student/assignment.html')

    @staticmethod
    def assignment_info_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 2):
            return JsonResponse({'success': 1})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        uuid = request_body['uuid']
        assignment = c.execute(
            f"SELECT Name,Requirement,FileUUID,DueDate,SubmitTF,AssignDate FROM AssignmentT WHERE UUID = '{uuid}';"
        ).fetchall()[0]
        name = assignment[0]
        requirement = assignment[1]
        file_uuids = assignment[2].split(',')
        file_names = c.execute(
            ' UNION '.join([f"SELECT FileName FROM Files WHERE UUID = '{f_uuid}'" for f_uuid in file_uuids]) + ';')
        file_dict = {k: v[0] for k, v in zip(file_uuids, file_names)}
        due_date = assignment[3]
        submit_tf = assignment[4]
        submit_tf = bin(submit_tf)[2:].zfill(2)
        submit_t = bool(int(submit_tf[0]))
        submit_f = bool(int(submit_tf[1]))
        assign_date = assignment[5]
        submit_info = c.execute(f"SELECT Text,FileUUID from AssignmentS WHERE AssignmentUUID = '{uuid}' AND StudentName = '{utils.decode_cookie(utils.parse_cookie(request.headers['Cookie'])['TOKEN'])[1]}'").fetchall()
        submitted = bool(submit_info)
        if submitted:
            submit_info = list(submit_info[0])
            submitted_file_uuids = submit_info[1].split(',')
            submitted_file_names = c.execute(
                ' UNION '.join([f"SELECT FileName FROM Files WHERE UUID = '{f_uuid}'" for f_uuid in submitted_file_uuids]) + ';')
            submit_info[1] = {k: v[0] for k, v in zip(submitted_file_uuids, submitted_file_names)}
        return JsonResponse({
            'success': 0,
            'name': name, 'requirement': requirement,
            'file_dict': file_dict,
            'submit_t': submit_t, 'submit_f': submit_f,
            'due_date': due_date, 'assign_date': assign_date,
            'submitted': submitted, 'submit_info': submit_info
        })

    @staticmethod
    def submit_assignment_api(request):
        assert request.method == 'POST'
        if not verify_cookie(request, 2):
            return JsonResponse({'success': 1})
        request_body = str(request.body, encoding='utf-8')
        request_body = utils.parse_url_param(request_body)
        assignment_uuid = request_body['u']
        submission_uuid = utils.generate_uuid()
        if 't' in request_body:
            text = request_body['t']
        else:
            text = ''
        course_name = c.execute(
            "SELECT CourseName FROM AssignmentT WHERE UUID = '"
            f"{assignment_uuid}';"
        ).fetchall()[0][0]
        if 'f' in request_body:
            files = eval(request_body['f'])
            [c.execute(f"INSERT INTO Files VALUES ('{uuid_}', '{file_name}');") for uuid_, file_name in files.items()]
            files = ','.join(files.keys())
        else:
            files = ''
        submit_date = int(time.time())
        c.execute(
            f"INSERT INTO AssignmentS VALUES ('{submission_uuid}', '{assignment_uuid}', "
            f"'{utils.decode_cookie(utils.parse_cookie(request.headers['Cookie'])['TOKEN'])[1]}', "
            f"'{course_name}', '{utils.string_escape(text)}', '{files}', {submit_date});"
        )
        conn.commit()
        return JsonResponse({'success': 0})
