import time
import random
import zlib

user_type_dict = {
    0: 'admin',
    1: 'teacher',
    2: 'student'
}
char_set = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def parse_url_param(s):
    s = s.split('&')
    s = [i.split('=') for i in s]
    s = {k: v for k, v in s}
    return s


def parse_cookie(s):
    s = s.split('; ')
    s = [i.split('=') for i in s]
    s = {k: v for k, v in s}
    return s


def baseN(num, b):
    return ((num == 0) and "0") or (baseN(num // b, b).lstrip("0") + char_set[num % b])


def encode_cookie(username):
    r = baseN(int(time.time() - 1599913600)**2, 36)  # 16进制转10进制
    r = zlib.compress(bytes(r, encoding='ascii') + bytes(username, encoding='ascii').zfill(16))
    r = ''.join([hex(i)[2:].zfill(2) for i in r]).upper()
    return r


def decode_cookie(cookie):
    cookie = cookie.lower()
    timestamp = []
    while cookie:
        timestamp.append(cookie[:2])
        cookie = cookie[2:]
    timestamp = [int(i, base=16) for i in timestamp]
    timestamp = bytes(timestamp)
    timestamp = zlib.decompress(timestamp).decode('ascii')
    timestamp, username = timestamp[:-16], timestamp[-16:]
    timestamp = int(int(timestamp, base=36)**0.5)+1600000000
    username = username.replace('0', '')
    valid = time.time() < timestamp
    return valid, username


def generate_uuid():
    return ''.join(random.sample(char_set, 16))


def string_escape(string):
    return string.replace("'", "''")
