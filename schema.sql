-- schema.sql
-- This file sets up the database for the attendance project.
-- Run it one of two ways:
--   1) mysql command line:  mysql -u root < schema.sql
--   2) phpMyAdmin: Import tab -> choose this file -> Go

-- make the database if it's not already there
CREATE DATABASE IF NOT EXISTS attendance_db;

-- tell MySQL to use this database for the statements below
USE attendance_db;

-- table 1: the list of students
-- seat_no is the number you see on the seating chart (like a roll call number)
-- roll_no is the actual college roll number, e.g. CB.SC.U4CSE24201
CREATE TABLE IF NOT EXISTS students (
  seat_no  INT PRIMARY KEY,
  roll_no  VARCHAR(20) NOT NULL UNIQUE,
  name     VARCHAR(100) NOT NULL
);

-- table 2: attendance records
-- every row here means "this seat was ABSENT on this date"
-- if there's no row for a seat on a date, that student was PRESENT that day
-- (this way we don't need to store 62 rows every single day, only the absentees)
CREATE TABLE IF NOT EXISTS attendance (
  att_date DATE NOT NULL,
  seat_no  INT NOT NULL,
  PRIMARY KEY (att_date, seat_no),          -- same seat can't be marked absent twice on one date
  FOREIGN KEY (seat_no) REFERENCES students(seat_no)  -- seat_no must exist in students table
);
