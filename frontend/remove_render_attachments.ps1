$filePath = "c:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages\RelatorioPreliminar.jsx"
$content = Get-Content -Raw $filePath

# Remove renderAttachments={() => <FileAttachmentManager ... />}
$content = [regex]::Replace($content, '\s*renderAttachments={\(\) => <FileAttachmentManager[^>]+/>}', '')

Set-Content -Path $filePath -Value $content
