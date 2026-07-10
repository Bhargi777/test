<?php
// report.php
// Shows who was present/absent on a given date. Pick a date at the top,
// defaults to today. This is where the "retrieve from SQL" part happens -
// everything on this page comes straight from the database.

require "db.php";

// if a date was picked in the URL (?date=2026-07-08), use that, else today
if (isset($_GET["date"]) && $_GET["date"] != "") {
    $chosen_date = $_GET["date"];
} else {
    $chosen_date = date("Y-m-d");
}

// load every student
$students = [];
$result = $conn->query("SELECT seat_no, roll_no, name FROM students ORDER BY seat_no");
while ($row = $result->fetch_assoc()) {
    $students[(int) $row["seat_no"]] = $row;
}

// load which seats were absent on the chosen date
$absent_seats = [];
$stmt = $conn->prepare("SELECT seat_no FROM attendance WHERE att_date = ?");
$stmt->bind_param("s", $chosen_date);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $absent_seats[(int) $row["seat_no"]] = true;
}
$stmt->close();

// split students into two lists: present and absent
$present_list = [];
$absent_list = [];
foreach ($students as $seat_no => $student) {
    if (isset($absent_seats[$seat_no])) {
        $absent_list[] = $student;
    } else {
        $present_list[] = $student;
    }
}

$total = count($students);
if ($total > 0) {
    $percent = round((count($present_list) / $total) * 100);
} else {
    $percent = 0;
}

$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Attendance Report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="page">

    <header class="topbar">
        <h1>Attendance report</h1>
        <a class="btn btn-outline" href="index.php">Back to board</a>
    </header>

    <form method="get" class="date-form">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="<?php echo htmlspecialchars($chosen_date); ?>">
        <button type="submit" class="btn">Go</button>
    </form>

    <p class="summary">
        <?php echo htmlspecialchars($chosen_date); ?> -
        <?php echo count($present_list); ?> present,
        <?php echo count($absent_list); ?> absent,
        <?php echo $total; ?> total (<?php echo $percent; ?>%)
    </p>

    <div class="report-lists">
        <div class="list-card">
            <h2>Present (<?php echo count($present_list); ?>)</h2>
            <ol>
                <?php foreach ($present_list as $student): ?>
                    <li><?php echo $student["seat_no"] . " - " . htmlspecialchars($student["name"]) . " (" . htmlspecialchars($student["roll_no"]) . ")"; ?></li>
                <?php endforeach; ?>
                <?php if (count($present_list) == 0): ?>
                    <li class="empty">None</li>
                <?php endif; ?>
            </ol>
        </div>
        <div class="list-card">
            <h2>Absent (<?php echo count($absent_list); ?>)</h2>
            <ol>
                <?php foreach ($absent_list as $student): ?>
                    <li><?php echo $student["seat_no"] . " - " . htmlspecialchars($student["name"]) . " (" . htmlspecialchars($student["roll_no"]) . ")"; ?></li>
                <?php endforeach; ?>
                <?php if (count($absent_list) == 0): ?>
                    <li class="empty">None</li>
                <?php endif; ?>
            </ol>
        </div>
    </div>

</div>
</body>
</html>
