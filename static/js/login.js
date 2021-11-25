function login(usn, pwd) {
    let pwd_sha = sha1(pwd);
    post(
        'login',
        {'u': usn, 'p': pwd_sha},
        function (httpRequest) {
            let json = JSON.parse(httpRequest.responseText);
            let success = json['success'];
            if (success === 0) {
                setCookie('TOKEN', json['token'], 1)
                setCookie('USERNAME', json['username'], 1)
                setCookie('USERTYPE', json['usertype'], 1)
                window.location.href = json['usertype']
            } else if (success === 1) {
                window.alert('User not found')
            } else if (success === 2) {
                window.alert('Password incorrect')
            } else {
                window.alert('Unknown error')
            }
        }
    )
}
