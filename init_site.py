import sqlite3
conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()

cmds = [
    # Admin
    '''
CREATE TABLE Accounts
(
Username        TEXT PRIMARY KEY    NOT NULL,
Type            INT                 NOT NULL,
SHA1Password    TEXT                NOT NULL
);
    ''',
    # Teacher
    "INSERT INTO Accounts VALUES ('iBobby', 0, 'afdb501542ac7597bccf67d52b76b98810dc536c');",  # Syc040603
    '''
CREATE TABLE Courses
(
CourseName      TEXT PRIMARY KEY    NOT NULL,
TeacherName     TEXT                NOT NULL
);
    ''',
    "INSERT INTO Accounts VALUES ('TestT1', 1, 'f46343d1b4a013bb21541d3a2d4cb8b11138aa2f');",  # iamteacher1
    "INSERT INTO Courses VALUES ('TestC1', 'TestT1');",
    "INSERT INTO Accounts VALUES ('TestT2', 1, 'e8a7cbd0d9f44d0c28fec2b5d5d38976ccd7623c');",  # iamteacher2
    "INSERT INTO Courses VALUES ('TestC2', 'TestT2');",
    '''
CREATE TABLE AssignmentT
(
UUID            char(16) PRIMARY KEY    NOT NULL,
Name            TEXT                    NOT NULL,
CourseName      TEXT                    NOT NULL,
Requirement     TEXT,
FileUUID        TEXT,
SubmitTF        INT                     NOT NULL,
AssignDate      INT                     NOT NULL,
DueDate         INT                     NOT NULL
);
    ''',
    '''
CREATE TABLE AssignmentS
(
SubmissionUUID  char(16) PRIMARY KEY    NOT NULL,
AssignmentUUID  char(16)                NOT NULL,
StudentName     TEXT                    NOT NULL,
CourseName      TEXT                    NOT NULL,
Text            TEXT,
FileUUID        TEXT,
SubmissionDate  INT                     NOT NULL
);
    ''',
    '''
CREATE TABLE Files
(
UUID            char(16) PRIMARY KEY    NOT NULL,
FileName        TEXT                    NOT NULL
);
    ''',
    # Student
    "INSERT INTO Accounts VALUES ('TestS', 2, 'c1be2aeb6e81d8170d4260ac0e5d8be6121ab87d');",  # iamstudent

]

for cmd in cmds:
    c.execute(cmd)
# Type: {0: admin, 1: teacher, 2: student}
conn.commit()
conn.close()
