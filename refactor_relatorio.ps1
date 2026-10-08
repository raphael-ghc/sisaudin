$replacements = @(
    @{ Pattern = "\bReporteRecomendacaoFinal\b"; New = "RelatorioFinalRecomendacaoReporte" },
    @{ Pattern = "\breporteRecomendacaoFinal\b"; New = "relatorioFinalRecomendacaoReporte" },
    @{ Pattern = "\breporte_recomendacao_final\b"; New = "relatorio_final_recomendacao_reporte" },

    @{ Pattern = "\bInformacaoFinal\b"; New = "RelatorioFinalInformacao" },
    @{ Pattern = "\binformacaoFinal\b"; New = "relatorioFinalInformacao" },
    @{ Pattern = "\binformacao_final\b"; New = "relatorio_final_informacao" },

    @{ Pattern = "\bConstatacaoFinal\b"; New = "RelatorioFinalConstatacao" },
    @{ Pattern = "\bconstatacaoFinal\b"; New = "relatorioFinalConstatacao" },
    @{ Pattern = "\bconstatacao_final\b"; New = "relatorio_final_constatacao" },

    @{ Pattern = "\bRecomendacaoFinal\b"; New = "RelatorioFinalRecomendacao" },
    @{ Pattern = "\brecomendacaoFinal\b"; New = "relatorioFinalRecomendacao" },
    @{ Pattern = "\brecomendacao_final\b"; New = "relatorio_final_recomendacao" },

    @{ Pattern = "\bInformacaoPreliminar\b"; New = "RelatorioPreliminarInformacao" },
    @{ Pattern = "\binformacaoPreliminar\b"; New = "relatorioPreliminarInformacao" },
    @{ Pattern = "\binformacao_preliminar\b"; New = "relatorio_preliminar_informacao" },

    @{ Pattern = "\bConstatacao\b"; New = "RelatorioPreliminarConstatacao" },
    @{ Pattern = "\bRecomendacao\b"; New = "RelatorioPreliminarRecomendacao" }
)

# 1. Rename files and directories
$items = Get-ChildItem -Path "backend", "frontend" -Recurse | Where-Object { $_.Name -match "Informacao|Constatacao|Recomendacao|Reporte" }
foreach ($item in $items) {
    if (-not $item.Exists) { continue }
    $newName = $item.Name
    foreach ($rep in $replacements) {
        $newName = $newName -creplace $rep.Pattern, $rep.New
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
            if ($content -match $rep.Pattern) {
                $content = $content -creplace $rep.Pattern, $rep.New
                $modified = $true
            }
        }
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
        }
    } catch {
        Write-Host "Error processing file: $($file.FullName) - $_"
    }
}
