# Render the exact source rectangles and fitting positions used by wardrobe-art.js.
# This is a layer-registration QA image, not a browser screenshot. Source art is untouched.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$previewJson = & node --input-type=module -e "import {wardrobeLayers} from './dist/wardrobe-art.js'; const looks=['rust','moss','apron'].flatMap(outfit=>['cap','waves','braid'].map((hair,i)=>({outfit,hair,scarf:['none','cream','sage'][i],accessory:'swallow'}))); console.log(JSON.stringify(looks.map(look=>({look,layers:wardrobeLayers(look)}))));"
$previewLooks = $previewJson | ConvertFrom-Json
$previewCanvas = New-Object System.Drawing.Bitmap 1080,1620
$previewGraphics = [System.Drawing.Graphics]::FromImage($previewCanvas)
$previewGraphics.Clear([System.Drawing.Color]::FromArgb(246,231,204))
$previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$previewFont = New-Object System.Drawing.Font 'Georgia',13
$previewBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(83,65,45))
try {
  for ($previewIndex=0; $previewIndex -lt $previewLooks.Count; $previewIndex++) {
    $previewLook = $previewLooks[$previewIndex]
    $previewLeft = ($previewIndex % 3)*360+70
    $previewTop = [Math]::Floor($previewIndex/3)*540+25
    foreach ($previewLayer in $previewLook.layers) {
      $previewImage = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) ('dist/'+$previewLayer.src)))
      try {
        $previewRect = New-Object System.Drawing.RectangleF ([single]($previewLeft+$previewLayer.place[0]*.54)),([single]($previewTop+$previewLayer.place[1]*.54)),([single]($previewLayer.place[2]*.54)),([single]($previewLayer.place[3]*.54))
        $previewSource = New-Object System.Drawing.RectangleF ([single]$previewLayer.crop[0]),([single]$previewLayer.crop[1]),([single]$previewLayer.crop[2]),([single]$previewLayer.crop[3])
        $previewGraphics.DrawImage($previewImage,$previewRect,$previewSource,[System.Drawing.GraphicsUnit]::Pixel)
      } finally {$previewImage.Dispose()}
    }
    $previewGraphics.DrawString(($previewLook.look.outfit+' / '+$previewLook.look.hair+' / '+$previewLook.look.scarf),$previewFont,$previewBrush,[single]($previewLeft-35),[single]($previewTop+492))
  }
  $previewCanvas.Save((Join-Path (Get-Location) 'docs/wardrobe-registration.png'),[System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $previewGraphics.Dispose()
  $previewCanvas.Dispose()
  $previewFont.Dispose()
  $previewBrush.Dispose()
}
Write-Output 'Rendered docs/wardrobe-registration.png from the live fitting coordinates.'
