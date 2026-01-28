$files = Get-ChildItem -Path "src" -Recurse -File
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "<<<<<<< HEAD") {
        Write-Host "Fixing $($file.FullName)"
        
        # Regex to match the conflict block and keep the incoming part
        # Pattern: <<<<<<< HEAD ... ======= (Incoming) >>>>>>> ...
        
        # We use regex replace.
        # (?s) enables dot-matches-newline
        # We look for <<<<<<< HEAD followed by anything lazy until =======
        # Then we capture everything lazy until >>>>>>>
        # Then we match >>>>>>> and the rest of the line
        
        $newContent = $content -replace "(?s)<<<<<<< HEAD.*?=======\s+?(.*?)>>>>>>> [^\r\n]*", '$1'
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent -NoNewline
            Write-Host "Resolved."
        }
    }
}
