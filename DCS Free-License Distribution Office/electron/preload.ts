import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  windowMin: () => ipcRenderer.send('window-min'),
  windowMax: () => ipcRenderer.send('window-max'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowPin: (isPinned: boolean) => ipcRenderer.send('window-pin', isPinned),
  
  // 数据库：邮箱相关
  getEmails: () => ipcRenderer.invoke('db-get-emails'),
  addEmail: (address: string) => ipcRenderer.invoke('db-add-email', address),
  update2FA: (id: number, secret: string | null) => ipcRenderer.invoke('db-update-2fa', id, secret),
  updatePassword: (id: number, password: string) => ipcRenderer.invoke('db-update-password', id, password),
  deleteEmail: (id: number) => ipcRenderer.invoke('db-delete-email', id),
  
  // 【关键】清空数据库接口
  clearAllDatabase: () => ipcRenderer.invoke('clear-all-database'),
  
  // 数据库：资产相关
  getAssets: () => ipcRenderer.invoke('db-get-assets'),
  upsertAsset: (asset: any) => ipcRenderer.invoke('db-upsert-asset', asset),

  // 核心功能相关
  generateTOTP: (secret: string) => ipcRenderer.invoke('generate-totp', secret),
  fetchMails: (emailAddress: string) => ipcRenderer.invoke('fetch-mails', emailAddress),
  pingApi: (emailAddress: string) => ipcRenderer.invoke('ping-api', emailAddress),
  
  // 备份与系统操作
  getDefaultBackupPath: () => ipcRenderer.invoke('get-default-backup-path'),
  selectBackupPath: (currentPath: string) => ipcRenderer.invoke('select-backup-path', currentPath),
  executeBackup: (targetPath: string) => ipcRenderer.invoke('execute-backup', targetPath),
  executeRestore: (defaultPath: string) => ipcRenderer.invoke('execute-restore', defaultPath),
  
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url)
});