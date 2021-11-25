function show(which) {
    let buttons = document.getElementsByClassName('course-filter');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.background = ''
    }
    document.getElementById('course-'+which).style.background = 'grey'
    if (which === 'all') {
        let lines = document.getElementById('assignment-table').children;
        console.log(lines)
        console.log(lines.length)
        for (let i = 0; i < lines.length; i++) {
            lines[i].getElementsByTagName('tr')[0].style.display = '';
        }
    } else {
        let lines = document.getElementById('assignment-table').children;
        for (let i = 0; i < lines.length; i++) {
            let i_ = lines[i].getElementsByTagName('tr')[0];
            if (i_.className === which) {
                i_.style.display = ''
            } else {
                i_.style.display = 'none'
            }
        }
    }
}
function get_student_info() {
    get(
        'student_info_api',
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] === 0) {
                for (let i in json['courses']) {
                    document.getElementById('show-which').innerHTML += '<button class="course-filter" id="course-' + json['courses'][i] + '" onclick="show(\'' + json['courses'][i] + '\')">' + json['courses'][i] + '</button>';
                }
                for (let i in json['assignments']) {
                    i = json['assignments'][i];
                    let date = new Date();
                    date.setTime(i[4]*1000);
                    let due_date = formatDate(date)
                    document.getElementById('assignment-table').innerHTML += '<tbody><tr class="' + i[3] + '"><th>' + i[3] + '</th><td><a href="/student/assignment?uuid=' + i[2] +'">' + i[0] + '</a></td><td>' + i[1] + '</td><td>' + due_date + '</td></tr></tbody>';
                }
            } else if (json['success'] === 1){
                window.alert('Login error');
            } else if (json['success'] === 2){
                window.alert('Not student');
            } else {
                window.alert('Something went wrong!');
            }
        }
    )
}

function get_assignment_info() {
    let uuid = document.URL.split('?')[1].split('=')[1];
    post(
        'assignment_info_api',
        {'uuid': uuid},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] === 0) {
                // Assignment Name
                let name = json['name'];
                document.title += name + ' - Basket';
                document.getElementById('assignment-name').innerText += name;
                // Requirement
                let requirement = json['requirement'];
                document.getElementById('requirement').innerText += requirement;
                // Assignment Files
                add_file_link_to_html(json['file_dict'], 'assignment-files')
                // Due Date
                let due_date = new Date();
                due_date.setTime(json['due_date']*1000);
                document.getElementById('due-date').innerText += formatDate(due_date);
                // Submission
                if (json['submitted']) {
                    let label = document.getElementById('submitted')
                    label.innerHTML += '<span>Submitted text:<br>' + json['submit_info'][0].replaceAll("\n", "<br>") + '</span>'
                    if (json['submit_info'][1]) {
                        label.innerHTML += '<br>'
                    }
                    add_file_link_to_html(json['submit_info'][1], 'submitted')
                } else {
                    let label = document.getElementById('submit')
                    let submit_t = json['submit_t'];
                    let submit_f = json['submit_f'];
                    if (submit_t) {
                        label.innerHTML += '<span>Text:</span><br><textarea id="submit-t"></textarea>'
                        if (submit_f) {
                            label.innerHTML += '<br>'
                        }
                    }
                    if (submit_f) {
                        label.innerHTML += '<span>Upload files: </span><input type="file" id="files" name="files" multiple><button onclick="upload()">Upload</button><label id="upload-section"></label>'
                    }
                    label.innerHTML += '<br><button onclick="submit_assignment();">Done</button>'
                }
            } else if (json['success'] === 1){
                window.alert('Login error')
            } else if (json['success'] === 2){
                window.alert('Not admin')
            } else {
                window.alert('Something went wrong!')
            }
        }
    )
}

function submit_assignment() {
    let uuid = document.URL.split('?')[1].split('=')[1];
    let body = {'u': uuid};
    if (document.getElementById('files')) {
        if (document.getElementById('files').files.length !== 0) {
            window.alert('File not uploaded yet, upload file first.');
            return
        }
        var encoded_files = '{';
        for (let k in files) {
            encoded_files += '"' + k + '"' + ': "' + files[k] + '",';
        }
        encoded_files += '}';
        body['f'] = encoded_files;
    }
    if (document.getElementById('submit-t')) {
        body['t'] = document.getElementById('submit-t').value;
    }
    if (isEmptyObject(body)) {
        window.alert('Nothing to submit.');
        return
    }
    post(
        'submit_assignment_api',
        body,
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] === 0) {
                go_home()
            } else {
                window.alert('Unknown error')
            }
        }
    );
}
