$filePath = "c:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages\RelatorioPreliminar.jsx"
$content = Get-Content -Raw $filePath

# Replace standard static titles
$content = [regex]::Replace($content, '(<RichTextEditor\s+title="([^"]+)"(?:\s+[^>]+)*?)(\s*/>|\s*></RichTextEditor>)', {
    param($match)
    $tag = $match.Groups[1].Value
    $title = $match.Groups[2].Value
    $closing = $match.Groups[3].Value

    # Skip if it already has renderAttachments
    if ($tag -match 'renderAttachments=') {
        return $match.Value
    }

    if ($title -notmatch '\$') {
        $propsToAdd = "`n                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('$title')} onUpload={(file) => handleUploadAnexo(file, '$title')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}"
        return $tag + $propsToAdd + $closing
    }

    return $match.Value
})

# Replace dynamic titles (with backticks)
$content = [regex]::Replace($content, '(<RichTextEditor\s+title={`([^`]+)`}(?:\s+[^>]+)*?)(\s*/>|\s*></RichTextEditor>)', {
    param($match)
    $tag = $match.Groups[1].Value
    $title = $match.Groups[2].Value
    $closing = $match.Groups[3].Value

    if ($tag -match 'renderAttachments=') {
        return $match.Value
    }

    $propsToAdd = "`n                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(``$title``)} onUpload={(file) => handleUploadAnexo(file, ``$title``)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}"
    
    # We must use proper interpolation syntax for the props
    $replacement = '{`' + $title + '`}'
    $propsToAdd = $propsToAdd.Replace('``$title``', $replacement)

    return $tag + $propsToAdd + $closing
})


Set-Content -Path $filePath -Value $content
