# search_attendance.py
#
# This script connects to MySQL straight from Python (no PHP involved) and
# lets you search attendance from the terminal. This is the "business logic
# layer" part of the project.
#
# Examples:
#   python search_attendance.py absent
#   python search_attendance.py absent 2026-07-08
#   python search_attendance.py find sri sai

import sys
from datetime import date
import mysql.connector

host = "localhost"
user = "root"
password = ""
database = "attendance_db"


def connect():
    return mysql.connector.connect(
        host=host, user=user, password=password, database=database
    )


def show_absentees(conn, att_date):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT students.seat_no, students.roll_no, students.name
        FROM attendance
        JOIN students ON students.seat_no = attendance.seat_no
        WHERE attendance.att_date = %s
        ORDER BY students.seat_no
        """,
        (att_date,),
    )
    rows = cursor.fetchall()
    cursor.close()

    if len(rows) == 0:
        print("Nobody was marked absent on", att_date)
        return

    print("Absent on", att_date, "-", len(rows), "student(s)")
    for seat_no, roll_no, name in rows:
        print(" seat", seat_no, "|", roll_no, "|", name)


def search_student(conn, keyword):
    cursor = conn.cursor()
    like_pattern = "%" + keyword + "%"

    cursor.execute(
        """
        SELECT seat_no, roll_no, name
        FROM students
        WHERE name LIKE %s OR roll_no LIKE %s
        ORDER BY seat_no
        """,
        (like_pattern, like_pattern),
    )
    matches = cursor.fetchall()

    if len(matches) == 0:
        print("No student found matching:", keyword)
        cursor.close()
        return

    for seat_no, roll_no, name in matches:
        print("seat", seat_no, "|", roll_no, "|", name)

        # now look up every date this student was absent
        cursor.execute(
            "SELECT att_date FROM attendance WHERE seat_no = %s ORDER BY att_date",
            (seat_no,),
        )
        absent_dates = cursor.fetchall()

        if len(absent_dates) == 0:
            print("  never marked absent")
        else:
            date_list = [str(d[0]) for d in absent_dates]
            print("  absent on:", ", ".join(date_list))

    cursor.close()


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python search_attendance.py absent [YYYY-MM-DD]")
        print("  python search_attendance.py find <name or roll>")
        return

    action = sys.argv[1]
    conn = connect()

    if action == "absent":
        if len(sys.argv) > 2:
            att_date = sys.argv[2]
        else:
            att_date = str(date.today())
        show_absentees(conn, att_date)

    elif action == "find":
        if len(sys.argv) < 3:
            print("Give a name or roll number to search for.")
        else:
            keyword = " ".join(sys.argv[2:])
            search_student(conn, keyword)

    else:
        print("Unknown command:", action)

    conn.close()


if __name__ == "__main__":
    main()
