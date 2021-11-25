function greet() {
    let user = getCookie('USERNAME')
    let date = new Date()
    let hour = date.getHours()
    var content = 'Opps'
    if (hour < 3 || hour >= 23) {
        content = 'Go to sleep! Good night ' + user + '.'
    } else if (hour >=3 && hour < 5) {
        content = 'Err, What are you doing, ' + user + '? '
    } else if (hour >=5 && hour < 7) {
        content = 'Good morning! You wake up early ' + user + '. '
    } else if (hour >= 7 && hour < 12) {
        content = 'Good morning ' + user + '. '
    } else if (hour >= 12 && hour < 18) {
        content = 'Good afternoon ' + user + '. '
    } else if (hour >= 18 && hour < 23) {
        content = 'Good evening ' + user + '. '
    }
    document.title += ': ' + user + ' - Basket'
    document.getElementById('welcome').innerHTML = content
    return 0
}

function reset_password(username) {
    let pwd = generate_random();
    let pwd_sha = sha1(pwd);
    post(
        'reset_password_api',
        {'u': username, 'p': pwd_sha},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 0) {
                window.alert('Change success, new password: \n' + pwd);
            }
        }
    )
}

function get_admin_info() {
    get(
        'admin_info',
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 0) {
                // Teacher
                for (let i in json['courses']) {
                    i = json['courses'][i];
                    console.log(i);
                    document.getElementById('course-table').innerHTML += '<tr><th>' + i[0] + '</th><td>' + i[1] + '</td><td><button onclick="reset_password(\'' + i[1] +'\')">Reset Password</button></td></tr>'
                }
                // Student
                for (let i in json['students']) {
                    i = json['students'][i];
                    document.getElementById('students-table').innerHTML += '<tr><th>' + i[0] + '</th><td><button onclick="reset_password(\'' + i[0] +'\')">Reset Password</button></td></tr>'
                }
            } else if (success === 1){
                window.alert('Login error')
            } else if (success === 2){
                window.alert('Not admin')
            } else {
                window.alert('Something went wrong!')
            }
        }
    )
}

function add_course(course_name, teacher_name) {
    let pwd = generate_random();
    let pwd_sha = sha1(pwd);
    post(
        'add_course_api',
        {'c': course_name, 't': teacher_name, 'p': pwd_sha},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 1) {
                window.alert('Added successfully, password is:\n' + pwd)
                window.location.href = '/admin'
            } else if (success === 0){
                window.alert('Login error')
            } else if (success === 2){
                window.alert('Not admin')
            } else {
                window.alert('Something went wrong!')
            }
        }
    )
}

function add_students(student_names) {
    let student_names_list = student_names.split(', ');
    let pwd_list = [];
    let pwd_sha_list = [];
    console.log(student_names_list)
    for (let i in student_names_list) {
        let pwd = generate_random();
        pwd_list.push(pwd);
        pwd_sha_list.push(sha1(pwd))
    }
    console.log(pwd_list)
    console.log(pwd_sha_list)
    post(
        'add_students_api',
        {'s': student_names_list, 'p': pwd_sha_list},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 1) {
                var innerHTML = ''
                innerHTML += ('<span>Added successfully. Passwords: </span>' +
                    '<table border="1"><th>Username</th><th>Password</th>')
                for (let i in student_names_list) {
                    innerHTML += ('<tr><th>' + student_names_list[i] + '</th><td>' + pwd_list[i] + '</td></tr>')
                }
                innerHTML += '</table>'
                document.getElementById('pwd-table').innerHTML = innerHTML
                document.getElementById('done-button').setAttribute('disabled', 'disabled')
            } else if (success === 0){
                window.alert('Login error')
            } else if (success === 2){
                window.alert('Not admin')
            } else {
                window.alert('Something went wrong!')
            }
        }
    )
}
