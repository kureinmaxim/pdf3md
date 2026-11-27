; Inno Setup script for PDF3MD

[Setup]
#define AppVersion "1.1.1"
AppName=PDF3MD
AppVersion={#AppVersion}
DefaultDirName=C:\Project\pdf3md
DefaultGroupName=PDF3MD
OutputBaseFilename=PDF3MD-Setup-{#AppVersion}
OutputDir=..\dist\windows
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
SetupIconFile=PDF3MD.ico
UninstallDisplayIcon={app}\windows\PDF3MD.ico

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs; Excludes: ".git,node_modules,venv,.venv,dist,__pycache__,*.pyc,.pids,logs,*.msi,unins*.exe,unins*.dat"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Icons]
Name: "{group}\PDF3MD (Start)"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\start_app.ps1"""; IconFilename: "{app}\windows\PDF3MD.ico"
Name: "{autodesktop}\PDF3MD"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\windows\start_app.ps1"""; WorkingDir: "{app}"; IconFilename: "{app}\windows\PDF3MD.ico"; Tasks: desktopicon
Name: "{group}\PDF3MD (Stop)"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\stop_app.ps1"""
Name: "{group}\PDF3MD (Open in Browser)"; Filename: "cmd.exe"; Parameters: "/c start http://localhost:6201"; IconFilename: "{app}\windows\PDF3MD.ico"
Name: "{group}\Uninstall PDF3MD"; Filename: "{uninstallexe}"

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\setup_app.ps1"""; Flags: postinstall waituntilterminated
