// General
function forAll() {
    if (String.prototype.replaceAll === undefined) {
        String.prototype.replaceAll = function (s1,s2) {
            return this.replace(new RegExp(s1,"gm"),s2);
        }
    }
}


let hexcase = 0;

// Align SHA1
function AlignSHA1(str) {
    let nblk = ((str.length + 8) >> 6) + 1,
        blks = new Array(nblk * 16);
    for (let i = 0; i < nblk * 16; i++) {
        blks[i] = 0;
    }
    for (var i = 0; i < str.length; i++) {
        blks[i >> 2] |= str.charCodeAt(i) << (24 - (i & 3) * 8);
    }
    blks[i >> 2] |= 0x80 << (24 - (i & 3) * 8);
    blks[nblk * 16 - 1] = str.length * 8;
    return blks;
}

// core_sha1
function rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

function safe_add(x, y) {
    let lsw = (x & 0xFFFF) + (y & 0xFFFF);
    let msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

function sha1_ft(t, b, c, d) {
    if (t < 20)
        return (b & c) | ((~b) & d);
    if (t < 40)
        return b ^ c ^ d;
    if (t < 60)
        return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}

function sha1_kt(t) {
    return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
}

function core_sha1(blockArray) {
    let x = blockArray; // append padding
    let w = Array(80);
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    let e = -1009589776;
    for (let i = 0; i < x.length; i += 16){
        let olda = a;
        let oldb = b;
        let oldc = c;
        let oldd = d;
        let olde = e;
        for (let j = 0; j < 80; j++) {
            if (j < 16)
                w[j] = x[i + j];
            else
                w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            let t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = t;
        }
        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
        e = safe_add(e, olde);
    }
    return [a, b, c, d, e];
}

// binb2hex
function binb2hex(binarray) {
    let hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for (let i = 0; i < binarray.length * 4; i++) {
        str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
    }
    return str
}

function sha1(s) {
    return binb2hex(core_sha1(AlignSHA1(s)));
}

function getCookie(cookie_name) {
    let allcookies = document.cookie;
    let cookie_pos = allcookies.indexOf(cookie_name);
    if (cookie_pos !== -1) {
        cookie_pos = cookie_pos + cookie_name.length + 1;
        let cookie_end = allcookies.indexOf(";", cookie_pos);
        if (cookie_end === -1) {
            cookie_end = allcookies.length;
        }
        return unescape(allcookies.substring(cookie_pos, cookie_end));
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*86400000));  // 24*60*60*1000
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function clearCookie(name) {
    setCookie(name, "", -1);
}

function get(url, func) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, true);
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            func(httpRequest)
        } else {
            console.log('Network error');
        }
    };
}

function post(url, body, func) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', url, true);
    httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    var new_body = '';
    for (let k in body) {
        new_body += k + '=' + body[k] + '&';
    }
    new_body = new_body.slice(0, new_body.length-1);
    httpRequest.send(new_body);
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            func(httpRequest)
        } else {
            console.log('Network error');
        }
    };
}

function verify_login_status() {
    let cookie = getCookie('TOKEN');
    let username = getCookie('USERNAME');
    if (cookie === undefined || username === undefined) {
        clearCookie('TOKEN');
        clearCookie('USERNAME');
        window.location.href = '/';
    } else {
        post(
            '/logedin',
            {'c': cookie, 'u': username},
            function (httpRequest) {
                let json = JSON.parse(httpRequest.responseText);
                let valid = json['valid'];
                if (valid === 0) {
                    clearCookie('TOKEN');
                    clearCookie('USERNAME');
                    window.location.href = '/';
                }
            }
        )
    }
}

function generate_random(n=8){
    var result = [];
    for(var i=0;i<n;i++){
        var ranNum = Math.ceil(Math.random() * 25);
        result.push(String.fromCharCode(65+ranNum));
    }
    return result.join('');
}

function logout() {
    clearCookie('TOKEN');
    clearCookie('USERNAME');
    window.location.href = '/';
}

function go_home() {
    window.location.href = '/' + getCookie('USERTYPE')
}

function normal_greet() {
    let user = getCookie('USERNAME');
    document.title += ': ' + user + ' - Basket';
    document.getElementById('welcome').innerText = 'Welcome to Basket, ' + user + '.';
}

function remove_file(file_uuid) {
    console.log(file_uuid);
    document.getElementById('file_' + file_uuid).remove();
    delete files[file_uuid];
    if (document.getElementById('uploaded-table').getElementsByTagName('tbody').length === 1) {
        document.getElementById('uploaded-table').remove();
    }
}

var files = {};
function upload() {
    var file_num = 0;
    if (document.getElementById('files').files.length === 0) {
        window.alert('Please select a file.');
        return
    }
    if (document.getElementById('uploaded-table')) {
        let table = document.getElementById('uploaded-table');
        let file_info = document.getElementById('files').files;
        for (let f = 0; f < file_info.length; f++) {
            table.innerHTML += '<tbody id="file_' + file_num + '"><tr><td>' + file_info[f].name + '</td><td>Waiting for upload</td><td><button onclick="">Cancel</button></td></tr></tbody>'
            file_num += 1;
        }
    } else {
        let table = document.createElement('table');
        table.id = 'uploaded-table';
        table.innerHTML = "<th>File Name</th><th>State</th><th>Remove</th>"
        let file_info = document.getElementById('files').files;
        for (let f = 0; f < file_info.length; f++) {
            table.innerHTML += '<tbody id="file_' + file_num + '"><tr><td>' + file_info[f].name + '</td><td>Waiting for upload</td><td><button onclick="">Cancel</button></td></tr></tbody>'
            file_num += 1;
        }
        document.getElementById('upload-section').appendChild(table);
    }
    var body = new FormData();
    for (let i in document.getElementById('files').files) {
        body.append("files", document.getElementById("files").files[i]);
    }
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', '/upload', true);
    httpRequest.send(body);
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            let json = JSON.parse(httpRequest.responseText);
            if (json['success'] !== 0) {
                window.alert('Failed');
            } else {
                let file_info = json['file'];
                for (let i = 0; i < file_num; i ++) {
                    console.log('ppp')
                    let file_tag = document.getElementById('file_'+i);
                    file_tag.id = 'file_' + file_info[i][1];
                    file_tag.getElementsByTagName('td')[1].innerText = 'Uploaded';
                    file_tag.getElementsByTagName('td')[2].innerHTML = '<button onclick="remove_file(\'' + file_info[i][1] + '\')">Remove</button>';
                    files[file_info[i][1]] = file_info[i][0];
                }
                document.getElementById('files').value = '';
            }
        } else {
            console.log('Network error');
        }
    };
}

function toBool(x) {
    return {
        'false': 0,
        'true': 1
    }[x]
}

function isEmptyObject(obj) {
    for (let n in obj) {
        return false;
    }
    return true;
}

function zfill(num, n) {
    return (Array(n).join(0) + num).slice(-n);
}

function formatDate(date) {
    return [[date.getFullYear(), date.getMonth() + 1, date.getDate()].join('.'), [zfill(date.getHours(), 2), zfill(date.getMinutes(), 2)].join(':')].join(' ')
}

function add_file_link_to_html(file_dict, id) {
    if (!isEmptyObject(file_dict)) {
        let innerHTML = '<span>Files:</span><br>';
        let file_links = Array();
        for (let k in file_dict) {
            file_links.push('<a href="/file?uuid=' + k + '">' + file_dict[k] + '</a>');
        }
        innerHTML += file_links.join('<br>')
        document.getElementById(id).innerHTML += innerHTML
    }
}