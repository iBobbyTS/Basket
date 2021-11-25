function DateSelector(selYear, selMonth, selDay) {
    this.selYear = selYear;
    this.selMonth = selMonth;
    this.selDay = selDay;
    this.selYear.Group = this;
    this.selMonth.Group = this;
    if (window.document.all != null) {  // IE
        this.selYear.attachEvent("onchange", DateSelector.Onchange);
        this.selMonth.attachEvent("onchange", DateSelector.Onchange);
    }
    else {  // Firefox
        this.selYear.addEventListener("change", DateSelector.Onchange, false);
        this.selMonth.addEventListener("change", DateSelector.Onchange, false);
    }
    if (arguments.length === 4)
        this.InitSelector(arguments[3].getFullYear(), arguments[3].getMonth() + 1, arguments[3].getDate());
    else if (arguments.length === 6)
        this.InitSelector(arguments[3], arguments[4], arguments[5]);
    else {
        let dt = new Date();
        this.InitSelector(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    }
}
let dt = new Date();
DateSelector.prototype.MinYear = dt.getFullYear();
DateSelector.prototype.MaxYear = dt.getFullYear() + (function (getMonth) {
    if (getMonth>=8) {
        return 1
    } else {
        return 0
    }
}(dt.getMonth()));
DateSelector.prototype.InitYearSelect = function () {
    for (let i = this.MaxYear; i >= this.MinYear; i--) {
        let op = window.document.createElement("OPTION");
        op.value = i;
        op.innerHTML = i;
        this.selYear.appendChild(op);
    }
}
DateSelector.prototype.InitMonthSelect = function () {
    for (var i = 1; i < 13; i++) {
        var op = window.document.createElement("OPTION");
        op.value = i;
        op.innerHTML = i;
        this.selMonth.appendChild(op);
    }
}
DateSelector.DaysInMonth = function (year, month) {
    var date = new Date(year, month, 0);
    return date.getDate();
}
DateSelector.prototype.InitDaySelect = function () {
    var year = parseInt(this.selYear.value);
    var month = parseInt(this.selMonth.value);
    var daysInMonth = DateSelector.DaysInMonth(year, month);
    this.selDay.options.length = 0;
    for (var i = 1; i <= daysInMonth; i++) {
        var op = window.document.createElement("OPTION");
        op.value = i;
        op.innerHTML = i;
        this.selDay.appendChild(op);
    }
}
DateSelector.Onchange = function (e) {
    var selector = window.document.all != null ? e.srcElement : e.target;
    selector.Group.InitDaySelect();
}
DateSelector.prototype.InitSelector = function (year, month, day) {
    this.selYear.options.length = 0;
    this.selMonth.options.length = 0;
    this.InitYearSelect();
    this.InitMonthSelect();
    this.selYear.selectedIndex = this.MaxYear - year;
    this.selMonth.selectedIndex = month - 1;
    this.InitDaySelect();
    this.selDay.selectedIndex = day - 1;
}

function init_date_selector() {
    let date = new Date();
    let timeOffset = date.getTimezoneOffset();
    date.setTime(date.getTime()-timeOffset*60000-28800000);
    new DateSelector(
        window.document.getElementById("selYear"),
        window.document.getElementById("selMonth"),
        window.document.getElementById("selDay"),
        date.getFullYear(), date.getMonth() + 1, date.getDate() + 1
    );
    let hour_element = document.getElementById("hour");
    for (let i = 0; i < 24; i += 3) {
        let i_ = String(i);
        hour_element.options.add(new Option(i_, i_));
    }
    let minute_element = document.getElementById("minute");
    for (let i = 0; i < 60; i += 15) {
        let i_ = String(i);
        minute_element.options.add(new Option(i_, i_));
    }
    hour_element[Math.floor(date.getHours()/3)].selected = true;
    minute_element[Math.floor(date.getMinutes()/15)].selected = true;
}

function get_teacher_info() {
    get(
        'teacher_info_api',
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] === 0) {
                // Teacher
                let innerHTML = '';
                for (let i in json['assignments']) {
                    i = json['assignments'][i];
                    innerHTML += '<tr><th><a href="/teacher/assignment?uuid=' + i[2] +'">' + i[0] + '</a></th><td>' + i[1] + '</td></tr>';
                }
                document.getElementById('assignments-table').innerHTML += innerHTML;
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

function add_assignment() {
    if (document.getElementById('files').files.length !== 0) {
        window.alert('File not uploaded yet, upload file first.');
        return
    }
    let submission_date = new Date();
    submission_date.setFullYear(
        document.getElementById('selYear').value,
        document.getElementById('selMonth').value - 1,
        document.getElementById('selDay').value
    );
    submission_date.setHours(
        document.getElementById('hour').value,
        document.getElementById('minute').value
    );
    var encoded_files = '{';
    for (let k in files) {
        encoded_files += '"' + k + '"' + ': "' + files[k] + '",';
    }
    encoded_files += '}';
    post(
        'add_assignment_api',
        {
            'n': document.getElementById('assignment-name').value,
            'r': document.getElementById('requirement').value,
            'st': toBool(document.getElementById('submit-text').checked),
            'sf': toBool(document.getElementById('submit-file').checked),
            'f': encoded_files,
            't': Math.floor(submission_date.getTime()/1000),
        },
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

function get_assignment_info() {
    let uuid = document.URL.split('?')[1].split('=')[1];
    post(
        'assignment_info_api',
        {'uuid': uuid},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] === 0) {
                let name = json['name'];
                document.title += name + ' - Basket';
                document.getElementById('assignment-name').innerText += name;
                let requirement = json['requirement'].replaceAll("\n", "<br>");
                document.getElementById('requirement').innerText += requirement;
                let file_dict = json['file_dict'];
                if (!isEmptyObject(file_dict)) {
                    document.getElementById('files').innerHTML = '<span>Files:</span><br>'
                    for (let k in file_dict) {
                        document.getElementById('files').innerHTML += '<a href="/file?uuid=' + k + '">' + file_dict[k] + '</a><br>'
                    }
                }
                let date = new Date();
                date.setTime(json['due_date'] * 1000);
                document.getElementById('due-date').innerText += formatDate(date)
                let submission = json['submission'];
                if (!isEmptyObject(submission)) {
                    var innerHTML = '';
                    for (let i in submission) {
                        let submit_time = new Date();
                        submit_time.setTime(submission[i][2] * 1000);
                        console.log(submission[i][1]);
                        innerHTML += '<tr><th>' + submission[i][0] + '</th><td>' + submission[i][1].replaceAll("\n", "<br>") + '</td><td>' + formatDate(submit_time) + '</td><td>';
                        for (let k in submission[i][3]) {
                            innerHTML += '<a href="/file?uuid=' + k + '">' + submission[i][3][k] + '</a>';
                        }
                    }
                    document.getElementById('submission-table').innerHTML += innerHTML;
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
