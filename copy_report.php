<?php
// copy_report.php
// Quick copy-paste list of roll numbers only (no names). View report has
// the full detail; this page is just for pasting roll numbers somewhere
// else fast. No JavaScript means no "click to copy" button - instead the
// roll numbers sit in a readonly text box, click inside it, Ctrl+A, Ctrl+C.

require "db.php";

if (isset($_GET["date"]) && $_GET["date"] != "") {
    $chosen_date = $_GET["date"];
} else {
    $chosen_date = date("Y-m-d");
}

$students = [];
$result = $conn->query("SELECT seat_no, roll_no FROM students ORDER BY seat_no");
while ($row = $result->fetch_assoc()) {
    $students[(int) $row["seat_no"]] = $row["roll_no"];
}

$absent_seats = [];
$stmt = $conn->prepare("SELECT seat_no FROM attendance WHERE att_date = ?");
$stmt->bind_param("s", $chosen_date);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $absent_seats[(int) $row["seat_no"]] = true;
}
$stmt->close();
$conn->close();

$present_rolls = [];
$absent_rolls = [];
foreach ($students as $seat_no => $roll_no) {
    if (isset($absent_seats[$seat_no])) {
        $absent_rolls[] = $roll_no;
    } else {
        $present_rolls[] = $roll_no;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Copy Report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="page">

    <header class="topbar">
        <h1>Copy report</h1>
        <a class="btn btn-outline" href="index.php">Back to board</a>
    </header>

    <form method="get" class="date-form">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="<?php echo htmlspecialchars($chosen_date); ?>">
        <button type="submit" class="btn">Go</button>
    </form>

    <p class="hint">Click inside a box, Ctrl+A to select all, Ctrl+C to copy.</p>

    <div class="report-lists">
        <div class="list-card">
            <h2>Absent roll numbers (<?php echo count($absent_rolls); ?>)</h2>
            <textarea readonly rows="8"><?php echo htmlspecialchars(implode(", ", $absent_rolls)); ?></textarea>
        </div>
        <div class="list-card">
            <h2>Present roll numbers (<?php echo count($present_rolls); ?>)</h2>
            <textarea readonly rows="8"><?php echo htmlspecialchars(implode(", ", $present_rolls)); ?></textarea>
        </div>
    </div>

</div>
</body>
</html>
