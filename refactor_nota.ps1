$replacements = @(
    @{ Old = "ReporteNotaFinalRecomendacaoFinal"; New = "NotaFinalRecomendacaoReporte" },
    @{ Old = "reporteNotaFinalRecomendacaoFinal"; New = "notaFinalRecomendacaoReporte" },
    @{ Old = "reporte_nota_final_recomendacao_final"; New = "nota_final_recomendacao_reporte" },

    @{ Old = "NotaFinalInformacaoFinal"; New = "NotaFinalInformacao" },
    @{ Old = "notaFinalInformacaoFinal"; New = "notaFinalInformacao" },
    @{ Old = "nota_final_informacao_final"; New = "nota_final_informacao" },

    @{ Old = "NotaFinalConstatacaoFinal"; New = "NotaFinalConstatacao" },
    @{ Old = "notaFinalConstatacaoFinal"; New = "notaFinalConstatacao" },
    @{ Old = "nota_final_constatacao_final"; New = "nota_final_constatacao" },

    @{ Old = "NotaFinalRecomendacaoFinal"; New = "NotaFinalRecomendacao" },
    @{ Old = "notaFinalRecomendacaoFinal"; New = "notaFinalRecomendacao" },
    @{ Old = "nota_final_recomendacao_final"; New = "nota_final_recomendacao" },

    @{ Old = "NotaInformacaoPreliminar"; New = "NotaPreliminarInformacao" },
    @{ Old = "notaInformacaoPreliminar"; New = "notaPreliminarInformacao" },
    @{ Old = "nota_informacao_preliminar"; New = "nota_preliminar_informacao" },

    @{ Old = "NotaConstatacao"; New = "NotaPreliminarConstatacao" },
    @{ Old = "notaConstatacao"; New = "notaPreliminarConstatacao" },
    @{ Old = "nota_constatacao"; New = "nota_preliminar_constatacao" },

    @{ Old = "NotaRecomendacao"; New = "NotaPreliminarRecomendacao" },
    @{ Old = "notaRecomendacao"; New = "notaPreliminarRecomendacao" },
    @{ Old = "nota_recomendacao"; New = "nota_preliminar_recomendacao" }
)

# 1. Rename files and directories
$items = Get-ChildItem -Path "backend", "frontend" -Recurse | Where-Object { $_.Name -match "Nota|Reporte" }
foreach ($item in $items) {
    if (-not $item.Exists) { continue }
    $newName = $item.Name
    foreach ($rep in $replacements) {
        $newName = $newName -creplace $rep.Old, $rep.New
    }
    if ($newName -cne $item.Name) {
        Rename-Item -Path $item.FullName -NewName $newName -PassThru
    }
}

# 2. Replace content inside files
$files = Get-ChildItem -Path "backend/src", "frontend/src" -Recurse -File -Include "*.java", "*.js", "*.jsx", "*.html", "*.xml", "*.css"
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $modified = $false
        foreach ($rep in $replacements) {
            if ($content -cnotmatch $rep.Old) { continue }
            $content = $content -creplace $rep.Old, $rep.New
            $modified = $true
        }
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
        }
    } catch {
        Write-Host "Error processing file: $($file.FullName) - $_"
    }
}
