"use strict";const{app:e,BrowserWindow:t}=require("electron"),{join:s}=require("path");process.env.ELECTRON_DISABLE_SECURITY_WARNINGS="true";const i=()=>{const n=new t({width:1100,minWidth:1100,height:700,minHeight:700,webPreferences:{webSecurity:!1,userAgent:"PostmanRuntime/7.37.0"}});process.env.VITE_DEV_SERVER_URL?n.loadURL(process.env.VITE_DEV_SERVER_URL):n.loadFile(s(__dirname,"../dist/index.html"))};e.whenReady().then(()=>{i(),e.on("activate",()=>{t.getAllWindows().length===0&&i()})});e.on("window-all-closed",()=>{process.platform!=="darwin"&&e.quit()});
