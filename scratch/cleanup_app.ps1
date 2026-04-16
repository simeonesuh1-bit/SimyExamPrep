$p = 'c:\Users\simeon\Desktop\SimycExamPrep\src\App.jsx'
$content = Get-Content $p
$utilityLineIndex = -1
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match "UTILITY") {
        $utilityLineIndex = $i
        break
    }
}
if ($utilityLineIndex -gt 140) {
    # Keep lines before garbage (up to line 140, index 139)
    # And then lines from utility marker
    $newContent = $content[0..139] + $content[($utilityLineIndex - 2)..($content.Length - 1)]
    $newContent | Set-Content $p
    Write-Output "Removed garbage. Utility line found at index $utilityLineIndex"
} else {
    Write-Output "Target line not found or index too small: $utilityLineIndex"
}
