<?php
/**
 * SB Elevators Central Parts Catalog API
 * Supports MySQL Database (u412886035_sbesdb) with JSON cache fallback
 * Cross-Origin Resource Sharing (CORS) enabled
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$dataFile = __DIR__ . '/parts.json';

// Helper to save base64 image payload directly to uploads directory
function saveBase64ImageToUploads($imageInput) {
    if (empty($imageInput) || !is_string($imageInput)) {
        return '';
    }
    if (preg_match('/^data:image\/(\w+);base64,/', $imageInput, $matches)) {
        $uploadDir = __DIR__ . '/uploads';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
            @chmod($uploadDir, 0777);
        }
        $imgType = strtolower($matches[1]);
        if ($imgType === 'jpeg') $imgType = 'jpg';
        if (!in_array($imgType, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
            $imgType = 'png';
        }
        $base64String = substr($imageInput, strpos($imageInput, ',') + 1);
        $decoded = base64_decode($base64String);
        if ($decoded !== false) {
            $randomSuffix = substr(md5(uniqid(mt_rand(), true)), 0, 8);
            $fileName = 'part_' . time() . '_' . $randomSuffix . '.' . $imgType;
            $dest = $uploadDir . '/' . $fileName;
            if (file_put_contents($dest, $decoded) !== false) {
                @chmod($dest, 0644);
                return '/api/uploads/' . $fileName;
            }
        }
    }
    return $imageInput;
}

// Helper to format part row for client
function formatPartRow($p) {
    if (isset($p['specs']) && is_string($p['specs'])) {
        $decoded = json_decode($p['specs'], true);
        $p['specs'] = is_array($decoded) ? $decoded : [];
    } elseif (!isset($p['specs']) || !is_array($p['specs'])) {
        $p['specs'] = [];
    }

    $p['price'] = isset($p['price']) ? floatval($p['price']) : 0;
    $p['inStock'] = isset($p['inStock']) ? (bool)$p['inStock'] : true;
    $p['stockCount'] = isset($p['stockCount']) ? intval($p['stockCount']) : 10;
    $p['minOrder'] = isset($p['minOrder']) ? intval($p['minOrder']) : 1;
    return $p;
}

// ────────────────────────────────────────────────────────────────
// GET: Fetch All Catalog Parts
// ────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM `parts` ORDER BY `updated_at` DESC");
            $rows = $stmt->fetchAll();
            $formatted = array_map('formatPartRow', $rows ?: []);
            echo json_encode($formatted, JSON_UNESCAPED_UNICODE);
            exit();
        } catch (Exception $e) {
            error_log("Database query error: " . $e->getMessage());
        }
    }

    // Fallback: Read JSON file
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo !empty($content) ? $content : json_encode([]);
    } else {
        echo json_encode([]);
    }
    exit();
}

// ────────────────────────────────────────────────────────────────
// DELETE: Delete Part or Clear All
// ────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $code = isset($_GET['code']) ? trim($_GET['code']) : '';
    $title = isset($_GET['title']) ? trim(strtolower($_GET['title'])) : '';
    $clearAll = isset($_GET['clear_all']) && $_GET['clear_all'] === 'true';

    if ($pdo) {
        try {
            if ($clearAll) {
                $pdo->exec("TRUNCATE TABLE `parts`");
            } else {
                $delStmt = $pdo->prepare("
                    DELETE FROM `parts` 
                    WHERE (`id` = :id AND :id != '') 
                       OR (`code` = :code AND :code != '') 
                       OR (LOWER(`title`) = :title AND :title != '')
                ");
                $delStmt->execute([':id' => $id, ':code' => $code, ':title' => $title]);
            }
        } catch (Exception $e) {
            error_log("Database delete error: " . $e->getMessage());
        }
    }

    // Also synchronize local JSON file
    if (file_exists($dataFile)) {
        if ($clearAll) {
            file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT));
        } else {
            $existingJson = file_get_contents($dataFile);
            $parts = json_decode($existingJson, true) ?: [];
            $filtered = array_values(array_filter($parts, function($p) use ($id, $code, $title) {
                $pid = isset($p['id']) ? trim((string)$p['id']) : '';
                $pcode = isset($p['code']) ? trim((string)$p['code']) : '';
                $ptitle = isset($p['title']) ? trim(strtolower((string)$p['title'])) : '';
                if (!empty($id) && $pid === $id) return false;
                if (!empty($code) && $pcode === $code) return false;
                if (!empty($title) && $ptitle === $title) return false;
                return true;
            }));
            file_put_contents($dataFile, json_encode($filtered, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
    }

    echo json_encode(['success' => true, 'message' => $clearAll ? 'All parts cleared.' : 'Part deleted successfully.']);
    exit();
}

// ────────────────────────────────────────────────────────────────
// POST: Add Single Part or Bulk Import
// ────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.']);
        exit();
    }

    // Bulk Upload
    if (isset($data['bulk']) && is_array($data['bulk'])) {
        $addedCount = 0;

        if ($pdo) {
            try {
                $pdo->beginTransaction();
                $upsert = $pdo->prepare("
                    INSERT INTO `parts` 
                    (`id`, `code`, `itemCode`, `title`, `category`, `price`, `priceUnit`, `unit`, `moq`, `minOrder`, `badge`, `inStock`, `stockCount`, `leadTime`, `warranty`, `compliance`, `image`, `description`, `specs`)
                    VALUES 
                    (:id, :code, :itemCode, :title, :category, :price, :priceUnit, :unit, :moq, :minOrder, :badge, :inStock, :stockCount, :leadTime, :warranty, :compliance, :image, :description, :specs)
                    ON DUPLICATE KEY UPDATE 
                    `title` = VALUES(`title`),
                    `category` = VALUES(`category`),
                    `price` = VALUES(`price`),
                    `priceUnit` = VALUES(`priceUnit`),
                    `unit` = VALUES(`unit`),
                    `moq` = VALUES(`moq`),
                    `badge` = VALUES(`badge`),
                    `inStock` = VALUES(`inStock`),
                    `stockCount` = VALUES(`stockCount`),
                    `leadTime` = VALUES(`leadTime`),
                    `warranty` = VALUES(`warranty`),
                    `compliance` = VALUES(`compliance`),
                    `image` = VALUES(`image`),
                    `description` = VALUES(`description`),
                    `specs` = VALUES(`specs`)
                ");

                foreach ($data['bulk'] as $idx => $item) {
                    if (empty($item['title'])) continue;
                    $pCode = !empty($item['code']) ? trim($item['code']) : 'SB-' . substr(time(), -5) . '-' . ($idx + 1);
                    $pId = !empty($item['id']) ? trim($item['id']) : $pCode;
                    $savedImage = saveBase64ImageToUploads($item['image'] ?? '');
                    $data['bulk'][$idx]['image'] = $savedImage;

                    $upsert->execute([
                        ':id' => $pId,
                        ':code' => $pCode,
                        ':itemCode' => !empty($item['itemCode']) ? $item['itemCode'] : $pCode,
                        ':title' => trim($item['title']),
                        ':category' => $item['category'] ?? 'Traction & Motors',
                        ':price' => floatval($item['price'] ?? 0),
                        ':priceUnit' => $item['priceUnit'] ?? ($item['unit'] ?? 'Piece'),
                        ':unit' => $item['unit'] ?? ($item['priceUnit'] ?? 'Piece'),
                        ':moq' => $item['moq'] ?? '1 Unit',
                        ':minOrder' => intval($item['minOrder'] ?? 1),
                        ':badge' => $item['badge'] ?? '',
                        ':inStock' => isset($item['inStock']) ? ($item['inStock'] ? 1 : 0) : 1,
                        ':stockCount' => intval($item['stockCount'] ?? 10),
                        ':leadTime' => $item['leadTime'] ?? 'Same Day Dispatch',
                        ':warranty' => $item['warranty'] ?? '24 Months OEM Warranty',
                        ':compliance' => $item['compliance'] ?? 'EN 81-20 / IS 14665',
                        ':image' => $savedImage,
                        ':description' => $item['description'] ?? '',
                        ':specs' => is_array($item['specs'] ?? null) ? json_encode($item['specs'], JSON_UNESCAPED_UNICODE) : '[]'
                    ]);
                    $addedCount++;
                }
                $pdo->commit();
            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                error_log("Database bulk error: " . $e->getMessage());
            }
        }

        // Backup to parts.json
        $existingJson = file_exists($dataFile) ? file_get_contents($dataFile) : '';
        $existing = json_decode($existingJson, true) ?: [];
        $combined = array_merge($data['bulk'], $existing);
        $seen = [];
        $deduped = [];
        foreach ($combined as $c) {
            $k = $c['code'] ?? ($c['id'] ?? '');
            if ($k && !isset($seen[$k])) {
                $seen[$k] = true;
                $deduped[] = $c;
            }
        }
        file_put_contents($dataFile, json_encode($deduped, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo json_encode([
            'success' => true,
            'message' => "Bulk upload complete. {$addedCount} parts synced to MySQL database.",
            'count' => $addedCount
        ]);
        exit();
    }

    // Single Part Upload
    $newPart = $data;
    if (empty($newPart['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Product title is required.']);
        exit();
    }

    $pCode = !empty($newPart['code']) ? trim($newPart['code']) : 'SB-' . substr(time(), -6);
    $pId = !empty($newPart['id']) ? trim($newPart['id']) : $pCode;
    $newPart['id'] = $pId;
    $newPart['code'] = $pCode;
    $newPart['itemCode'] = $pCode;
    $newPart['image'] = saveBase64ImageToUploads($newPart['image'] ?? '');

    if ($pdo) {
        try {
            $singleUpsert = $pdo->prepare("
                INSERT INTO `parts` 
                (`id`, `code`, `itemCode`, `title`, `category`, `price`, `priceUnit`, `unit`, `moq`, `minOrder`, `badge`, `inStock`, `stockCount`, `leadTime`, `warranty`, `compliance`, `image`, `description`, `specs`)
                VALUES 
                (:id, :code, :itemCode, :title, :category, :price, :priceUnit, :unit, :moq, :minOrder, :badge, :inStock, :stockCount, :leadTime, :warranty, :compliance, :image, :description, :specs)
                ON DUPLICATE KEY UPDATE 
                `title` = VALUES(`title`),
                `category` = VALUES(`category`),
                `price` = VALUES(`price`),
                `priceUnit` = VALUES(`priceUnit`),
                `unit` = VALUES(`unit`),
                `moq` = VALUES(`moq`),
                `badge` = VALUES(`badge`),
                `inStock` = VALUES(`inStock`),
                `stockCount` = VALUES(`stockCount`),
                `leadTime` = VALUES(`leadTime`),
                `warranty` = VALUES(`warranty`),
                `compliance` = VALUES(`compliance`),
                `image` = VALUES(`image`),
                `description` = VALUES(`description`),
                `specs` = VALUES(`specs`)
            ");

            $singleUpsert->execute([
                ':id' => $pId,
                ':code' => $pCode,
                ':itemCode' => $pCode,
                ':title' => trim($newPart['title']),
                ':category' => $newPart['category'] ?? 'Traction & Motors',
                ':price' => floatval($newPart['price'] ?? 0),
                ':priceUnit' => $newPart['priceUnit'] ?? ($newPart['unit'] ?? 'Piece'),
                ':unit' => $newPart['unit'] ?? ($newPart['priceUnit'] ?? 'Piece'),
                ':moq' => $newPart['moq'] ?? '1 Unit',
                ':minOrder' => intval($newPart['minOrder'] ?? 1),
                ':badge' => $newPart['badge'] ?? '',
                ':inStock' => isset($newPart['inStock']) ? ($newPart['inStock'] ? 1 : 0) : 1,
                ':stockCount' => intval($newPart['stockCount'] ?? 10),
                ':leadTime' => $newPart['leadTime'] ?? 'Same Day Dispatch',
                ':warranty' => $newPart['warranty'] ?? '24 Months OEM Warranty',
                ':compliance' => $newPart['compliance'] ?? 'EN 81-20 / IS 14665',
                ':image' => $newPart['image'] ?? '',
                ':description' => $newPart['description'] ?? '',
                ':specs' => is_array($newPart['specs'] ?? null) ? json_encode($newPart['specs'], JSON_UNESCAPED_UNICODE) : '[]'
            ]);
        } catch (Exception $e) {
            error_log("Database single upsert error: " . $e->getMessage());
        }
    }

    // Sync to parts.json
    $existingJson = file_exists($dataFile) ? file_get_contents($dataFile) : '';
    $parts = json_decode($existingJson, true) ?: [];
    $parts = array_values(array_filter($parts, function($p) use ($newPart) {
        return ($p['id'] ?? '') !== $newPart['id'] && ($p['code'] ?? '') !== $newPart['code'];
    }));
    array_unshift($parts, $newPart);
    file_put_contents($dataFile, json_encode($parts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => 'Part saved successfully to MySQL database and catalog',
        'part' => $newPart
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
