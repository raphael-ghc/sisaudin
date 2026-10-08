$filePath = "c:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages\RelatorioPreliminar.jsx"
$content = Get-Content -Raw $filePath

$content = [regex]::Replace($content, '(<RichTextEditor\s+title="([^"]+)"([^>]*?))(\s*/>)', {
    param($match)
    $tag = $match.Groups[1].Value
    $title = $match.Groups[2].Value
    $rest = $match.Groups[3].Value
    $closing = $match.Groups[4].Value

    if ($tag -match 'attachments=') { return $match.Value }

    $props = "`n                  attachments={getAnexosBySecao('$title')}`n                  onUploadAttachment={(file) => handleUploadAnexo(file, '$title')}`n                  onDeleteAttachment={handleDeleteAnexo}"
    return $tag + $props + $closing
})

$content = [regex]::Replace($content, '(<RichTextEditor\s+title={`([^`]+)`}([^>]*?))(\s*/>)', {
    param($match)
    $tag = $match.Groups[1].Value
    $title = $match.Groups[2].Value
    $rest = $match.Groups[3].Value
    $closing = $match.Groups[4].Value

    if ($tag -match 'attachments=') { return $match.Value }

    $props = "`n                  attachments={getAnexosBySecao(``$title``)}`n                  onUploadAttachment={(file) => handleUploadAnexo(file, ``$title``)}`n                  onDeleteAttachment={handleDeleteAnexo}"
    return $tag + $props + $closing
})

Set-Content -Path $filePath -Value $content
