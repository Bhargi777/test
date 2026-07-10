<?php
// db.php
// This file just opens a connection to MySQL. Every other PHP page that
// needs the database does require "db.php"; at the top, and then it can
// use the $conn variable.

$host = "localhost";
$user = "root";
$password = "";        // WampServer's MySQL root user has no password by default
$database = "attendance_db";

$conn = new mysqli($host, $user, $password, $database);

// if the connection didn't work, stop everything and show why
if ($conn->connect_error) {
    die("Could not connect to the database: " . $conn->connect_error);
}
