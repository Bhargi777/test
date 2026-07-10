<?php
// index.php
// This is the main page: the seating chart. Click a seat number and it
// toggles that student between present and absent for today.
//
// There's no JavaScript here. Every click is a small HTML <form> that
// submits (POST) back to this same page, PHP updates the database, and
// then we redirect back to this page so a refresh doesn't submit again.
// This redirect-after-post trick is usually called "Post/Redirect/Get".

require "db.php";

$today = date("Y-m-d"); // e.g. "2026-07-10"

// ---------------------------------------------------------
// STEP 1: handle whatever button was just clicked (if any)
// ---------------------------------------------------------

// did someone click a seat button?
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["toggle"])) {
    $seat_no = (int) $_POST["toggle"];

    // check if this seat is already marked absent today
    $check = $conn->prepare("SELECT 1 FROM attendance WHERE att_date = ? AND seat_no = ?");
    $check->bind_param("si", $today, $seat_no);
    $check->execute();
    $already_absent = $check->get_result()->num_rows > 0;
    $check->close();

    if ($already_absent) {
        // they were absent, clicking again means "actually they're here" -> remove the row
        $stmt = $conn->prepare("DELETE FROM attendance WHERE att_date = ? AND seat_no = ?");
        $stmt->bind_param("si", $today, $seat_no);
        $new_status = "present";
    } else {
        // they were present (no row), clicking marks them absent -> add a row
        $stmt = $conn->prepare("INSERT INTO attendance (att_date, seat_no) VALUES (?, ?)");
        $stmt->bind_param("si", $today, $seat_no);
        $new_status = "absent";
    }
    $stmt->execute();
    $stmt->close();

    // was the board swapped when the click happened? carry that + the seat
    // we just changed through the redirect so the popup can show it
    $swap_param = (isset($_GET["swap"]) && $_GET["swap"] == "1") ? "swap=1&" : "";
    header("Location: index.php?" . $swap_param . "last=" . $seat_no . "&status=" . $new_status);
    exit;
}

// did someone click "Clear today"?
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["clear_today"])) {
    $stmt = $conn->prepare("DELETE FROM attendance WHERE att_date = ?");
    $stmt->bind_param("s", $today);
    $stmt->execute();
    $stmt->close();

    $swap_param = (isset($_GET["swap"]) && $_GET["swap"] == "1") ? "?swap=1" : "";
    header("Location: index.php" . $swap_param);
    exit;
}

// ?swap=1 in the URL flips which column is on the left/right
// (has to check the actual value, not just isset - "swap=0" is still "set")
$swap = isset($_GET["swap"]) && $_GET["swap"] == "1";

// ---------------------------------------------------------
// STEP 2: load data we need to draw the page
// ---------------------------------------------------------

// put every student into an array so we can look them up by seat number
$students = [];
$result = $conn->query("SELECT seat_no, roll_no, name FROM students");
while ($row = $result->fetch_assoc()) {
    $seat_no = (int) $row["seat_no"];
    $students[$seat_no] = $row;
}

// figure out which seats are absent today
$absent_today = [];
$stmt = $conn->prepare("SELECT seat_no FROM attendance WHERE att_date = ?");
$stmt->bind_param("s", $today);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $seat_no = (int) $row["seat_no"];
    $absent_today[$seat_no] = true;
}
$stmt->close();

// if we just came from a toggle (see the redirect above), build the
// bottom popup text: "12 -> Rahul Sharma : marked absent"
$popup_text = "";
if (isset($_GET["last"]) && isset($_GET["status"])) {
    $last_seat = (int) $_GET["last"];
    $last_status = $_GET["status"] == "absent" ? "absent" : "present";
    if (isset($students[$last_seat])) {
        $last_name = $students[$last_seat]["name"];
    } else {
        $last_name = "Unknown";
    }
    $popup_text = $last_seat . " -> " . $last_name . " : marked " . $last_status;
}

// ---------------------------------------------------------
// STEP 3: the seating chart layout
// ---------------------------------------------------------
// this is just where each seat number physically sits in the classroom.
// null means "no seat there" (empty spot in the layout).

$left_column = [
    [54, 53, 43, 7, 46, 40],
    [34, 48, 18, 39, 25, 49],
    [65, 55, 60, 20, 41, 13],
    [22, 2, 63, 61, 21, 57],
    [null, null, null, 29, 35, 66],
    [31, 9, null, null, null, null],
];

$right_column = [
    [null, null, 45, 30, 27, 32],
    [17, 37, 62, 51, 36, 14],
    [10, 28, 38, 5, 8, 56],
    [15, 52, 24, 33, 16, null],
    [4, 1, 47, 64, 23, 6],
    [12, 68, 44, 19, 50, 58],
];

if ($swap) {
    $columns = [$right_column, $left_column];
} else {
    $columns = [$left_column, $right_column];
}

// ---------------------------------------------------------
// STEP 4: numbers for the top counters + progress bar
// ---------------------------------------------------------

$total_seats = count($students);
$absent_count = count($absent_today);
$present_count = $total_seats - $absent_count;

if ($total_seats > 0) {
    $percent_present = round(($present_count / $total_seats) * 100);
} else {
    $percent_present = 0;
}

$date_label = date("D, j M Y"); // e.g. "Fri, 10 Jul 2026"

// draws one column of seats as HTML.
// each real seat becomes its own little form with one button in it.
function draw_column($column, $absent_today, $students) {
    foreach ($column as $row_of_seats) {
        echo "<div class='seat-row'>";
        foreach ($row_of_seats as $seat_no) {

            if ($seat_no === null) {
                // empty gap in the layout, just leave blank space
                echo "<div class='empty-seat'></div>";
                continue;
            }

            $is_absent = isset($absent_today[$seat_no]);
            $css_class = $is_absent ? "seat-btn absent" : "seat-btn";

            if (isset($students[$seat_no])) {
                $student_name = $students[$seat_no]["name"];
            } else {
                $student_name = "Unknown";
            }

            echo "<div class='seat'>";
            echo "<form method='post'>";
            echo "<button type='submit' name='toggle' value='" . $seat_no . "' class='" . $css_class . "' title='" . htmlspecialchars($student_name) . "'>";
            echo $seat_no;
            echo "</button>";
            echo "</form>";
            echo "</div>";
        }
        echo "</div>";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Attendance</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="page">

    <header class="topbar">
        <h1>Attendance - CSE C</h1>
        <span class="date"><?php echo $date_label; ?></span>
    </header>

    <div class="counts">
        <div class="count-box">
            <span class="count-num"><?php echo $present_count; ?></span>
            <span class="count-tag">present</span>
        </div>
        <div class="count-box">
            <span class="count-num"><?php echo $absent_count; ?></span>
            <span class="count-tag">absent</span>
        </div>
        <div class="count-box">
            <span class="count-num"><?php echo $total_seats; ?></span>
            <span class="count-tag">total</span>
        </div>
    </div>

    <div class="bar-track">
        <div class="bar-fill" style="width: <?php echo $percent_present; ?>%;"></div>
    </div>
    <p class="bar-pct"><?php echo $percent_present; ?>% present</p>

    <div class="actions">
        <a class="btn" href="index.php?swap=<?php echo $swap ? '0' : '1'; ?>">Swap sides</a>
        <a class="btn" href="report.php">View report</a>
        <a class="btn" href="copy_report.php">Copy report</a>
        <form method="post" style="display:inline">
            <button type="submit" name="clear_today" class="btn btn-outline">Clear today</button>
        </form>
    </div>

    <div class="board">
        <div class="col">
            <?php draw_column($columns[0], $absent_today, $students); ?>
        </div>
        <div class="divider"></div>
        <div class="col">
            <?php draw_column($columns[1], $absent_today, $students); ?>
        </div>
    </div>

    <p class="hint">Click a seat number to mark absent / present. Hover a seat to see the name.</p>

    <?php if ($popup_text != ""): ?>
        <div class="popup"><?php echo htmlspecialchars($popup_text); ?></div>
    <?php endif; ?>

</div>
</body>
</html>
<?php $conn->close(); ?>
