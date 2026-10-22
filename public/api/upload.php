<?php
/**
 * SB Elevators - Dedicated Image Upload API Endpoint
 * Stores uploaded spare part photos into /api/uploads/
 * Compatible with Apache / Hostinger / cPanel / Nginx / PHP 7.4+ / PHP 8.x
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Only POST is accepted.']);
    exit();
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
    @chmod($uploadDir, 0777);
}

$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
$allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
];

// ─────────────────────────────────────────────────────────────
// 1. Handle Standard Multipart Form File Upload ($_FILES)
// ─────────────────────────────────────────────────────────────
$fileKey = null;
if (isset($_FILES['image']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
    $fileKey = 'image';
} elseif (isset($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
    $fileKey = 'file';
}

if ($fileKey) {
    $file = $_FILES[$fileKey];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File upload error code: ' . $file['error']]);
        exit();
    }

    $originalName = $file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($extension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid file extension. Allowed: PNG, JPG, JPEG, WEBP, GIF, SVG.']);
        exit();
    }

    // Verify MIME type if finfo is available
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if ($mime && !in_array($mime, $allowedMimeTypes) && $extension !== 'svg') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid image MIME type: ' . $mime]);
            exit();
        }
    }

    $randomSuffix = substr(md5(uniqid(mt_rand(), true)), 0, 8);
    $newFileName = 'part_' . time() . '_' . $randomSuffix . '.' . $extension;
    $targetFilePath = $uploadDir . '/' . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        @chmod($targetFilePath, 0644);
        $publicUrl = '/api/uploads/' . $newFileName;
        echo json_encode([
            'success' => true,
            'url' => $publicUrl,
            'fileName' => $newFileName,
            'message' => 'Image successfully saved to uploads folder.'
        ]);
        exit();
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file to uploads directory.']);
        exit();
    }
}

// ─────────────────────────────────────────────────────────────
// 2. Handle JSON Base64 Payload ({ "image": "data:image/..." })
// ─────────────────────────────────────────────────────────────
$rawInput = file_get_contents('php://input');
if (!empty($rawInput)) {
    $json = json_decode($rawInput, true);
    $base64Data = $json['image'] ?? ($json['data'] ?? null);

    if ($base64Data && preg_match('/^data:image\/(\w+);base64,/', $base64Data, $typeMatches)) {
        $imgType = strtolower($typeMatches[1]);
        if ($imgType === 'jpeg') $imgType = 'jpg';

        if (!in_array($imgType, $allowedExtensions)) {
            $imgType = 'png';
        }

        $base64String = substr($base64Data, strpos($base64Data, ',') + 1);
        $decoded = base64_decode($base64String);

        if ($decoded !== false) {
            $randomSuffix = substr(md5(uniqid(mt_rand(), true)), 0, 8);
            $newFileName = 'part_' . time() . '_' . $randomSuffix . '.' . $imgType;
            $targetFilePath = $uploadDir . '/' . $newFileName;

            if (file_put_contents($targetFilePath, $decoded) !== false) {
                @chmod($targetFilePath, 0644);
                $publicUrl = '/api/uploads/' . $newFileName;
                echo json_encode([
                    'success' => true,
                    'url' => $publicUrl,
                    'fileName' => $newFileName,
                    'message' => 'Base64 image converted and saved to uploads folder.'
                ]);
                exit();
            }
        }
    }
}

http_response_code(400);
echo json_encode([
    'success' => false,
    'error' => 'No valid image file or base64 data received.'
]);
