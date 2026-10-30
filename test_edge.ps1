$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///C:/Users/jatin/OneDrive/Desktop/anti gravity/index.html'
$proc = Start-Process -FilePath $edge -ArgumentList "--headless=new", "--disable-gpu", "--dump-dom", "`"$url`"" -RedirectStandardOutput "dom_dump.html" -RedirectStandardError "dom_err.log" -Wait -PassThru
Get-Item "dom_dump.html" -ErrorAction SilentlyContinue | Select-Object Name, Length
Get-Item "dom_err.log" -ErrorAction SilentlyContinue | Select-Object Name, Length
