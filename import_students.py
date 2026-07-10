# import_students.py
#
# This is a one-time setup script. It reads the "CSE C.csv" file and puts
# every student into the MySQL "students" table.
#
# Run this AFTER schema.sql has been applied (so the table exists).
#
#   pip install mysql-connector-python
#   python import_students.py

import csv
import mysql.connector

# same login details WampServer's MySQL uses by default
host = "localhost"
user = "root"
password = ""
database = "attendance_db"

csv_filename = "CSE C.csv"


def get_seat_number(roll_no):
    # roll numbers look like CB.SC.U4CSE24201
    # the last 3 digits (201) minus 200 give us the seat number (1)
    # this only works because the seating chart happens to be numbered this way
    last_three_digits = roll_no[-3:]
    seat_no = int(last_three_digits) - 200
    return seat_no


def main():
    conn = mysql.connector.connect(
        host=host, user=user, password=password, database=database
    )
    cursor = conn.cursor()

    count = 0

    # open the csv file and read it row by row
    with open(csv_filename, newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)

        for row in reader:
            roll_no = row["Roll No"].strip()
            name = row["Name"].strip()
            seat_no = get_seat_number(roll_no)

            # ON DUPLICATE KEY UPDATE means: if this seat_no already exists,
            # just update the name/roll instead of throwing an error
            # (useful if we run this script more than once)
            sql = """
                INSERT INTO students (seat_no, roll_no, name)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE roll_no = %s, name = %s
            """
            cursor.execute(sql, (seat_no, roll_no, name, roll_no, name))
            count += 1

    conn.commit()  # save the changes to the database
    cursor.close()
    conn.close()

    print("Added/updated", count, "students in the database.")


if __name__ == "__main__":
    main()
