$files = @("src/data.js", "src/audio.js", "src/app.js")
foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file)
    $openBraces = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closeBraces = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $openParens = ($text.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $closeParens = ($text.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    $openBrackets = ($text.ToCharArray() | Where-Object { $_ -eq '[' }).Count
    $closeBrackets = ($text.ToCharArray() | Where-Object { $_ -eq ']' }).Count
    Write-Host "$file : Braces {$openBraces/$closeBraces} Parens ($openParens/$closeParens) Brackets [$openBrackets/$closeBrackets]"
}
