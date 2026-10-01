param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,
  [string]$AuditDirectory = "$PSScriptRoot\alpha-audit"
)

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path $PSScriptRoot -Parent
$assetDirectory = Join-Path $repoRoot 'public\assets\edo\characters\approved-live'
New-Item -ItemType Directory -Force $assetDirectory, $AuditDirectory | Out-Null

function New-ArgbBitmap([int]$width, [int]$height) {
  return [Drawing.Bitmap]::new($width, $height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Add-Polygon($graphicsPath, $points) {
  $drawingPoints = [Drawing.PointF[]]($points | ForEach-Object {
    [Drawing.PointF]::new($_[0], $_[1])
  })
  $graphicsPath.AddPolygon($drawingPoints)
}

function Export-MaskedCrop {
  param(
    [Drawing.Bitmap]$Source,
    [string]$Name,
    [int]$CropX,
    [int]$CropY,
    [int]$Width,
    [int]$Height,
    [array]$Polygons,
    [array]$Cutouts = @()
  )

  $crop = New-ArgbBitmap $Width $Height
  $mask = New-ArgbBitmap $Width $Height
  $output = New-ArgbBitmap $Width $Height
  try {
    $graphics = [Drawing.Graphics]::FromImage($crop)
    try {
      $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.DrawImage(
        $Source,
        [Drawing.Rectangle]::new(0, 0, $Width, $Height),
        [Drawing.Rectangle]::new($CropX, $CropY, $Width, $Height),
        [Drawing.GraphicsUnit]::Pixel
      )
    } finally { $graphics.Dispose() }

    $path = [Drawing.Drawing2D.GraphicsPath]::new()
    try {
      $path.FillMode = [Drawing.Drawing2D.FillMode]::Winding
      foreach ($polygon in $Polygons) { Add-Polygon $path $polygon.Points }
      $graphics = [Drawing.Graphics]::FromImage($mask)
      try {
        $graphics.Clear([Drawing.Color]::Transparent)
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $brush = [Drawing.SolidBrush]::new([Drawing.Color]::White)
        try { $graphics.FillPath($brush, $path) } finally { $brush.Dispose() }

        foreach ($cutout in $Cutouts) {
          $cutoutPath = [Drawing.Drawing2D.GraphicsPath]::new()
          try {
            Add-Polygon $cutoutPath $cutout.Points
            $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
            $eraser = [Drawing.SolidBrush]::new([Drawing.Color]::Transparent)
            try { $graphics.FillPath($eraser, $cutoutPath) } finally { $eraser.Dispose() }
          } finally { $cutoutPath.Dispose() }
        }
      } finally { $graphics.Dispose() }
    } finally { $path.Dispose() }

    for ($y = 0; $y -lt $Height; $y++) {
      for ($x = 0; $x -lt $Width; $x++) {
        $pixel = $crop.GetPixel($x, $y)
        $alpha = $mask.GetPixel($x, $y).A
        $output.SetPixel($x, $y, [Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
      }
    }

    $assetPath = Join-Path $assetDirectory "$Name-approved-live.png"
    $output.Save($assetPath, [Drawing.Imaging.ImageFormat]::Png)

    $audit = New-ArgbBitmap ($Width * 4) $Height
    $graphics = [Drawing.Graphics]::FromImage($audit)
    try {
      $graphics.DrawImageUnscaled($crop, 0, 0)
      $backgrounds = @(
        [Drawing.Color]::FromArgb(255, 255, 0, 255),
        [Drawing.Color]::FromArgb(255, 0, 190, 70),
        [Drawing.Color]::FromArgb(255, 118, 118, 118)
      )
      for ($index = 0; $index -lt $backgrounds.Count; $index++) {
        $brush = [Drawing.SolidBrush]::new($backgrounds[$index])
        try {
          $graphics.FillRectangle($brush, $Width * ($index + 1), 0, $Width, $Height)
        } finally { $brush.Dispose() }
        $graphics.DrawImageUnscaled($output, $Width * ($index + 1), 0)
      }
    } finally { $graphics.Dispose() }
    $auditPath = Join-Path $AuditDirectory "$Name-alpha-audit.png"
    $audit.Save($auditPath, [Drawing.Imaging.ImageFormat]::Png)
    $audit.Dispose()

    $grid = [Drawing.Bitmap]$crop.Clone()
    $graphics = [Drawing.Graphics]::FromImage($grid)
    try {
      $pen = [Drawing.Pen]::new([Drawing.Color]::FromArgb(180, 255, 0, 255), 1)
      $font = [Drawing.Font]::new('Arial', 10, [Drawing.FontStyle]::Bold)
      $labelBrush = [Drawing.SolidBrush]::new([Drawing.Color]::White)
      try {
        for ($gridX = 0; $gridX -lt $Width; $gridX += 50) {
          $graphics.DrawLine($pen, $gridX, 0, $gridX, $Height)
          $graphics.DrawString("$gridX", $font, $labelBrush, $gridX + 2, 2)
        }
        for ($gridY = 0; $gridY -lt $Height; $gridY += 50) {
          $graphics.DrawLine($pen, 0, $gridY, $Width, $gridY)
          $graphics.DrawString("$gridY", $font, $labelBrush, 2, $gridY + 2)
        }
      } finally {
        $pen.Dispose()
        $font.Dispose()
        $labelBrush.Dispose()
      }
    } finally { $graphics.Dispose() }
    $grid.Save((Join-Path $AuditDirectory "$Name-coordinate-grid.png"), [Drawing.Imaging.ImageFormat]::Png)
    $grid.Dispose()

    [pscustomobject]@{ Asset = $assetPath; Audit = $auditPath; Crop = "$CropX,$CropY,$Width,$Height" }
  } finally {
    $crop.Dispose()
    $mask.Dispose()
    $output.Dispose()
  }
}

$playerHead = @(
  @(174, 135), @(163, 119), @(158, 102), @(164, 88), @(160, 72), @(171, 57),
  @(187, 45), @(204, 40), @(220, 32), @(238, 37), @(253, 31), @(269, 42),
  @(288, 48), @(304, 60), @(317, 74), @(329, 90), @(338, 107), @(340, 125),
  @(334, 143), @(325, 158), @(315, 174), @(301, 185), @(286, 195), @(269, 200),
  @(251, 196), @(233, 187), @(218, 175), @(203, 164), @(190, 151)
)
$playerNeck = @(
  @(211, 157), @(232, 168), @(252, 177), @(272, 181), @(294, 174), @(315, 162),
  @(326, 177), @(320, 197), @(306, 214), @(284, 226), @(260, 231), @(238, 226),
  @(217, 214), @(199, 198), @(190, 179)
)
$playerScarf = @(
  @(176, 160), @(198, 168), @(220, 181), @(244, 191), @(270, 188), @(294, 177),
  @(316, 165), @(329, 181), @(325, 201), @(315, 222), @(302, 243), @(281, 259),
  @(255, 267), @(230, 261), @(207, 249), @(188, 231), @(174, 209), @(166, 184)
)
$playerTorso = @(
  @(141, 211), @(169, 204), @(195, 216), @(217, 232), @(245, 241), @(276, 229),
  @(309, 211), @(337, 212), @(359, 230), @(374, 258), @(391, 295), @(405, 337),
  @(416, 382), @(420, 427), @(415, 469), @(402, 503), @(389, 529), @(99, 529),
  @(88, 501), @(82, 467), @(81, 431), @(85, 391), @(95, 350), @(111, 311),
  @(127, 276)
)
$playerLeftArm = @(
  @(126, 245), @(145, 246), @(160, 260), @(176, 284), @(188, 312), @(190, 339),
  @(180, 361), @(163, 375), @(139, 385), @(112, 387), @(87, 381), @(69, 367),
  @(59, 345), @(61, 320), @(72, 296), @(89, 274), @(108, 256)
)
$playerRightArm = @(
  @(305, 229), @(330, 231), @(351, 248), @(368, 273), @(381, 302), @(391, 332),
  @(391, 361), @(380, 385), @(361, 399), @(340, 399), @(322, 388), @(307, 368),
  @(298, 341), @(296, 308), @(297, 274)
)
$playerHat = @(
  @(4, 373), @(22, 350), @(46, 335), @(72, 330), @(98, 337), @(122, 351),
  @(142, 373), @(157, 401), @(164, 433), @(162, 464), @(154, 493), @(144, 520),
  @(4, 520)
)

$landlordSilhouette = @(
  @(113, 121), @(108, 105), @(111, 85), @(121, 66), @(139, 51), @(160, 42),
  @(181, 38), @(202, 42), @(222, 52), @(239, 68), @(250, 87), @(253, 105),
  @(262, 119), @(257, 134), @(264, 148), @(256, 162), @(246, 174), @(230, 185),
  @(215, 192), @(239, 190), @(263, 180), @(290, 180), @(312, 195), @(328, 219),
  @(342, 248), @(355, 280), @(366, 316), @(377, 355), @(388, 397), @(399, 442),
  @(409, 489), @(121, 489), @(105, 466), @(90, 435), @(77, 401), @(66, 365),
  @(58, 331), @(55, 299), @(60, 268), @(72, 237), @(87, 210), @(103, 190),
  @(116, 180), @(120, 166), @(116, 151)
)
$landlordFaceArmCutout = @(
  @(94, 111), @(117, 116), @(134, 129), @(145, 143), @(146, 158), @(138, 170),
  @(127, 179), @(120, 196), @(114, 215), @(102, 236), @(91, 220), @(95, 197),
  @(101, 175), @(104, 151)
)

$source = [Drawing.Bitmap]::FromFile($SourcePath)
try {
  Export-MaskedCrop -Source $source -Name 'player' -CropX 20 -CropY 125 -Width 510 -Height 530 -Polygons @(
    @{ Points = $playerHead },
    @{ Points = $playerNeck },
    @{ Points = $playerScarf },
    @{ Points = $playerTorso },
    @{ Points = $playerLeftArm },
    @{ Points = $playerRightArm },
    @{ Points = $playerHat }
  )
  Export-MaskedCrop -Source $source -Name 'landlord' -CropX 640 -CropY 165 -Width 430 -Height 490 -Polygons @(
    @{ Points = $landlordSilhouette }
  ) -Cutouts @(
    @{ Points = $landlordFaceArmCutout }
  )
} finally { $source.Dispose() }
