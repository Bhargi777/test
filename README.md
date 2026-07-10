# Class Attendance System

Seating-chart attendance tracker for CSE C. Click a seat number to mark a
student absent or present. Built with PHP, MySQL, HTML, CSS — no JavaScript.
Includes a Python script for querying attendance from the command line.

## Stack

| Layer | Tech |
|---|---|
| Database | MySQL (`students`, `attendance` tables) |
| Web / frontend | PHP + HTML + CSS (`index.php`, `report.php`, `db.php`) |
| Business logic | Python (`import_students.py`, `search_attendance.py`) |

## Setup (WampServer)

1. Copy this whole folder into `C:\wamp64\www\attendance\`.
2. Start WampServer (Apache + MySQL running, icon green).
3. Create the database — either way works:
   - **phpMyAdmin**: open `http://localhost/phpmyadmin`, go to Import, choose `schema.sql`, Go.
   - **Command prompt**: `mysql -u root < schema.sql` (from the project folder).
4. Load the students from the CSV:
   ```
   pip install mysql-connector-python
   python import_students.py
   ```
   This reads `CSE C.csv` and inserts all 62 students into `students`.
5. Open `http://localhost/attendance/index.php`.

## Using it

- Click a seat's number to toggle it absent (red) / present (green). Each click
  submits a small form and reloads the page — attendance is saved in MySQL
  immediately, tied to today's date.
- **Swap sides** mirrors the two seating columns.
- **Clear today** wipes today's absences (starts the day fresh).
- **View report** (`report.php`) shows present/absent lists with names and
  roll numbers for any date — pick a date and click Go. Printable.

## Data model

- `students(seat_no, roll_no, name)` — one row per student. `seat_no` is the
  number shown on the seating chart, derived from the roll number
  (`CB.SC.U4CSE24201` → seat `1`).
- `attendance(att_date, seat_no)` — one row per seat marked **absent** on a
  given date. No row for a seat on a date means present. This keeps a full
  day-by-day history.

## Python: searching attendance

`search_attendance.py` connects directly to MySQL (not through PHP) and
answers two kinds of questions:

```
python search_attendance.py absent              # who's absent today
python search_attendance.py absent 2026-07-08    # who was absent on a date
python search_attendance.py find "Sri Sai"       # look up a student + their absence history
```

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Creates the database and tables |
| `import_students.py` | Loads `CSE C.csv` into `students` |
| `db.php` | MySQL connection used by the PHP pages |
| `index.php` | Seating board, toggle attendance |
| `report.php` | Attendance report by date |
| `search_attendance.py` | Command-line attendance search |
| `styles.css` | All styling |
| `CSE C.csv` | Source roster (roll numbers + names) |

## License

MIT — see [LICENSE](LICENSE).
