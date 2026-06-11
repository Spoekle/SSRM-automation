; Tauri NSIS installer hooks for font installation
; This file is included by Tauri's NSIS installer

!macro NSIS_HOOK_POSTINSTALL
    ; Install fonts to Windows Fonts directory
    SetOutPath "$FONTS"

    ; Copy Torus Pro fonts from the bundled resources
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Thin.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-ThinItalic.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Light.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-LightItalic.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Regular.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Italic.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-SemiBold.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-SemiBoldItalic.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Bold.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-BoldItalic.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-Heavy.ttf" "$FONTS"
    CopyFiles /SILENT "$INSTDIR\fonts\Torus.Pro\TorusPro-HeavyItalic.ttf" "$FONTS"

    ; Copy Aller font
    CopyFiles /SILENT "$INSTDIR\fonts\Aller_It.ttf" "$FONTS"

    ; Register fonts in Windows registry
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Thin (TrueType)" "TorusPro-Thin.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Thin Italic (TrueType)" "TorusPro-ThinItalic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Light (TrueType)" "TorusPro-Light.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Light Italic (TrueType)" "TorusPro-LightItalic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Regular (TrueType)" "TorusPro-Regular.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Italic (TrueType)" "TorusPro-Italic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro SemiBold (TrueType)" "TorusPro-SemiBold.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro SemiBold Italic (TrueType)" "TorusPro-SemiBoldItalic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Bold (TrueType)" "TorusPro-Bold.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Bold Italic (TrueType)" "TorusPro-BoldItalic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Heavy (TrueType)" "TorusPro-Heavy.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Torus Pro Heavy Italic (TrueType)" "TorusPro-HeavyItalic.ttf"
    WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Aller Italic (TrueType)" "Aller_It.ttf"
!macroend
