function change_password() {
    let current_password = document.getElementById('cpwd').value
    let new_password = document.getElementById('npwd').value
    let verify_password = document.getElementById('vpwd').value
    if (new_password !== verify_password) {
        window.alert('New passwords mismatch')
        return 0;
    }
    let current_password_sha = sha1(current_password)
    let new_password_sha = sha1(new_password)
    post(
        'change_password_api',
        {'c': current_password_sha, 'n': new_password_sha},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 0) {
                window.alert('Change success');
                go_home();
            }
        }
    )
}