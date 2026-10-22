<?php
/**
 * SB Elevators - Quotation Request Handler
 * Submits customer quotation requests directly to sales@sbdat.com
 * Supports CORS and JSON payloads
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit();
}

require_once __DIR__ . '/db.php';
$pdo = getDbConnection();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.']);
    exit();
}

$name = isset($data['name']) ? trim($data['name']) : '';
$whatsapp = isset($data['whatsapp']) ? trim($data['whatsapp']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : $whatsapp;
if (empty($phone) && !empty($whatsapp)) {
    $phone = $whatsapp;
}
$gstin = isset($data['gstin']) ? trim($data['gstin']) : (isset($data['gst']) ? trim($data['gst']) : '');
$email = isset($data['email']) ? trim($data['email']) : '';
$city = isset($data['city']) ? trim($data['city']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';
$partCode = isset($data['partCode']) ? trim($data['partCode']) : 'PART';
$partTitle = isset($data['partTitle']) ? trim($data['partTitle']) : 'Elevator Component';
$quantity = isset($data['quantity']) ? intval($data['quantity']) : 1;
$unitPrice = isset($data['unitPrice']) ? floatval($data['unitPrice']) : 0;
$totalPrice = isset($data['totalPrice']) ? floatval($data['totalPrice']) : ($unitPrice * $quantity);
$unit = isset($data['unit']) ? trim($data['unit']) : 'Piece';

if (empty($name) || (empty($phone) && empty($whatsapp))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and WhatsApp number are required.']);
    exit();
}

$recipient = 'sales@sbdat.com';
$subject = "New Quotation Request: [{$partCode}] {$partTitle} - {$name}";

// 1. Insert into MySQL quotations table if database is connected
if ($pdo) {
    try {
        $qStmt = $pdo->prepare("
            INSERT INTO `quotations` 
            (`recipient`, `partCode`, `partTitle`, `quantity`, `unit`, `unitPrice`, `totalPrice`, `buyerName`, `phone`, `email`, `city`, `message`, `ip_address`)
            VALUES 
            (:recipient, :partCode, :partTitle, :quantity, :unit, :unitPrice, :totalPrice, :buyerName, :phone, :email, :city, :message, :ip)
        ");
        $qStmt->execute([
            ':recipient' => $recipient,
            ':partCode' => $partCode,
            ':partTitle' => $partTitle,
            ':quantity' => $quantity,
            ':unit' => $unit,
            ':unitPrice' => $unitPrice,
            ':totalPrice' => $totalPrice,
            ':buyerName' => $name,
            ':phone' => $phone,
            ':email' => $email,
            ':city' => $city,
            ':message' => $message,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Database quote insert error: " . $e->getMessage());
    }
}

// 2. Save quote to internal JSON audit log backup so no leads are ever lost
$logFile = __DIR__ . '/quotations.json';
$logEntry = [
    'timestamp' => date('c'),
    'recipient' => $recipient,
    'partCode' => $partCode,
    'partTitle' => $partTitle,
    'quantity' => $quantity,
    'unit' => $unit,
    'unitPrice' => $unitPrice,
    'totalPrice' => $totalPrice,
    'name' => $name,
    'phone' => $phone,
    'whatsapp' => $whatsapp ?: $phone,
    'gstin' => $gstin,
    'email' => $email,
    'city' => $city,
    'message' => $message,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

$existingQuotes = [];
if (file_exists($logFile)) {
    $rawLog = file_get_contents($logFile);
    if (!empty($rawLog)) {
        $existingQuotes = json_decode($rawLog, true) ?: [];
    }
}
array_unshift($existingQuotes, $logEntry);
file_put_contents($logFile, json_encode(array_slice($existingQuotes, 0, 500), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Build Professional HTML Email
$htmlBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>New Quotation Request</title>
</head>
<body style='font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
        <div style='background: #0745A7; padding: 20px; color: #ffffff;'>
            <h2 style='margin: 0; font-size: 20px; font-weight: bold;'>SB ELEVATORS - QUOTATION REQUEST</h2>
            <p style='margin: 5px 0 0; font-size: 13px; opacity: 0.9;'>Submitted to sales@sbdat.com</p>
        </div>
        
        <div style='padding: 24px;'>
            <h3 style='margin: 0 0 12px; font-size: 15px; color: #0745A7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;'>ITEM SPECIFICATIONS</h3>
            <table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;'>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; width: 35%; color: #64748b;'>Part Code:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-family: monospace; font-weight: bold; color: #0f172a;'>{$partCode}</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Part Name:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #0f172a;'>{$partTitle}</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Quantity:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #0f172a;'>{$quantity} {$unit}(s)</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Estimated Unit Price:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-family: monospace;'>₹" . number_format($unitPrice, 2) . "</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Estimated Total Value:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-family: monospace; font-weight: bold; color: #0745A7;'>₹" . number_format($totalPrice, 2) . "</td>
                </tr>
            </table>

            <h3 style='margin: 0 0 12px; font-size: 15px; color: #0745A7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;'>BUYER INFORMATION</h3>
            <table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;'>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; width: 35%; color: #64748b;'>Buyer Name:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #0f172a;'>{$name}</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>WhatsApp Number:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;'><a href='tel:{$phone}' style='color: #0745A7; text-decoration: none;'>{$phone}</a></td>
                </tr>" . (!empty($gstin) ? "
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>GSTIN:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-family: monospace; font-weight: bold; color: #0f172a;'>{$gstin}</td>
                </tr>" : "") . "
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Email Address:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7;'>" . (!empty($email) ? "<a href='mailto:{$email}' style='color: #0745A7; text-decoration: none;'>{$email}</a>" : "Not Provided") . "</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Delivery City/State:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7;'>" . (!empty($city) ? htmlspecialchars($city) : "Not Specified") . "</td>
                </tr>
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #64748b;'>Requirement Notes:</td>
                    <td style='padding: 8px; border-bottom: 1px solid #edf2f7; color: #334155;'>" . (!empty($message) ? nl2br(htmlspecialchars($message)) : "None") . "</td>
                </tr>
            </table>

            <div style='background: #f8fafc; border-left: 4px solid #0745A7; padding: 12px; font-size: 12px; color: #64748b; margin-top: 20px;'>
                <strong>Submission Timestamp:</strong> " . date('d M Y, h:i A T') . "<br>
                <strong>Recipient Mailbox:</strong> sales@sbdat.com
            </div>
        </div>
    </div>
</body>
</html>
";

// Headers for HTML email
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: SB Elevators Quotations <sales@sbdat.com>',
    'Reply-To: ' . (!empty($email) ? $email : 'sales@sbdat.com'),
    'X-Mailer: PHP/' . phpversion()
];

// Send email using PHP mail()
$mailSent = @mail($recipient, $subject, $htmlBody, implode("\r\n", $headers));

echo json_encode([
    'success' => true,
    'message' => 'Quotation request submitted successfully to sales@sbdat.com',
    'recipient' => $recipient,
    'mailSent' => $mailSent
]);
