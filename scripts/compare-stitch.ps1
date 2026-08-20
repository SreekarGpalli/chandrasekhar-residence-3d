Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$raw = Join-Path $root 'elevations\compare\raw'
$out = Join-Path $root 'elevations\compare'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$labels = @('V24','V26','V27','V29','V33','V34','V35','V36')
$views = @(
  @{ name = 'east';      title = 'EAST - street elevation' },
  @{ name = 'hero';      title = 'HERO - south-east three-quarter' },
  @{ name = 'se';        title = 'SOUTH-EAST - corner and east face' },
  @{ name = 'se-high';   title = 'SOUTH-EAST HIGH - second floor, pergola, SE corner' },
  @{ name = 'east-close';title = 'EAST CLOSE - living bay, door, rod screen' },
  @{ name = 'se-low';    title = 'SOUTH-EAST LOW - ground and first floor east' }
)

$cellW = 720
$cellH = 405
$cols = 4
$rows = 2
$gap = 10
$labelH = 32
$headerH = 56
$pad = 16
$bg = [System.Drawing.Color]::FromArgb(16, 18, 20)
$ink = [System.Drawing.Color]::FromArgb(236, 234, 225)
$dim = [System.Drawing.Color]::FromArgb(154, 152, 144)
$brass = [System.Drawing.Color]::FromArgb(201, 163, 106)

$headerFont = New-Object System.Drawing.Font 'Segoe UI', 16, ([System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font 'Segoe UI', 11, ([System.Drawing.FontStyle]::Bold)

foreach ($view in $views) {
  $gridW = $pad * 2 + $cols * $cellW + ($cols - 1) * $gap
  $gridH = $pad + $headerH + $rows * ($cellH + $labelH) + ($rows - 1) * $gap + $pad
  $bmp = New-Object System.Drawing.Bitmap $gridW, $gridH
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear($bg)
  $brushInk = New-Object System.Drawing.SolidBrush $ink
  $brushDim = New-Object System.Drawing.SolidBrush $dim
  $brushBrass = New-Object System.Drawing.SolidBrush $brass
  $g.FillRectangle($brushBrass, $pad, 22, 36, 3)
  $g.DrawString($view.title, $headerFont, $brushInk, ($pad + 48), 12)

  for ($i = 0; $i -lt $labels.Count; $i++) {
    $c = $i % $cols
    $r = [int][Math]::Floor($i / $cols)
    $x = $pad + $c * ($cellW + $gap)
    $y = $pad + $headerH + $r * ($cellH + $labelH + $gap)
    $srcPath = Join-Path $raw ($view.name + '-' + $labels[$i] + '.png')
    if (Test-Path $srcPath) {
      $src = [System.Drawing.Image]::FromFile($srcPath)
      $g.DrawImage($src, $x, $y, $cellW, $cellH)
      $src.Dispose()
    } else {
      $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(32,34,38))), $x, $y, $cellW, $cellH)
    }
    $g.DrawString($labels[$i], $labelFont, $brushBrass, $x, ($y + $cellH + 4))
  }

  $dest = Join-Path $out ($view.name + '.jpg')
  $jpeg = [System.Drawing.Imaging.ImageFormat]::Jpeg
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $enc = New-Object System.Drawing.Imaging.EncoderParameters 1
  $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]88)
  $bmp.Save($dest, $codec, $enc)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "wrote $dest"
}

$headerFont.Dispose(); $labelFont.Dispose()
Write-Output 'done'
