function Write-WavFile {
    param(
        [string]$Path,
        [float[]]$Samples,
        [int]$SampleRate = 22050
    )
    $numSamples = $Samples.Length
    $subChunk2Size = $numSamples * 2
    $chunkSize = 36 + $subChunk2Size
    $byteRate = $SampleRate * 2
    $blockAlign = 2
    $bitsPerSample = 16

    $bytes = New-Object byte[] (44 + $subChunk2Size)
    $ms = New-Object System.IO.MemoryStream($bytes)
    $bw = New-Object System.IO.BinaryWriter($ms)
    
    # RIFF header
    $bw.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF"))
    $bw.Write([int32]$chunkSize)
    $bw.Write([System.Text.Encoding]::ASCII.GetBytes("WAVE"))
    
    # fmt chunk
    $bw.Write([System.Text.Encoding]::ASCII.GetBytes("fmt "))
    $bw.Write([int32]16)
    $bw.Write([int16]1) # PCM
    $bw.Write([int16]1) # Mono
    $bw.Write([int32]$SampleRate)
    $bw.Write([int32]$byteRate)
    $bw.Write([int16]$blockAlign)
    $bw.Write([int16]$bitsPerSample)
    
    # data chunk
    $bw.Write([System.Text.Encoding]::ASCII.GetBytes("data"))
    $bw.Write([int32]$subChunk2Size)
    
    for ($i = 0; $i -lt $numSamples; $i++) {
        $s = $Samples[$i]
        if ($s -gt 1.0) { $s = 1.0 }
        elseif ($s -lt -1.0) { $s = -1.0 }
        $val = [int16]($s * 32760.0)
        $bw.Write($val)
    }
    
    $bw.Flush()
    [System.IO.File]::WriteAllBytes($Path, $bytes)
    $bw.Close()
    $ms.Close()
}

$sr = 22050
$dur = 0.5
$n = [int]($sr * $dur)
$samples = New-Object float[] $n
for ($i = 0; $i -lt $n; $i++) {
    $t = $i / $sr
    $samples[$i] = [Math]::Sin(2 * [Math]::PI * 440 * $t) * [Math]::Exp(-$t * 4)
}
Write-WavFile -Path "assets\audio\test.wav" -Samples $samples -SampleRate $sr
Write-Host "Generated test.wav size: $((Get-Item 'assets\audio\test.wav').Length) bytes"
