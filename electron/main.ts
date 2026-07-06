import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  registerFileDialogHandlers,
} from './ipc/fileDialogHandlers.js'

import {
  registerJobHandlers,
} from './ipc/jobHandlers.js'

import {
  jobManager,
} from './services/jobManager.js'

import {
  getPythonCommand,
  getPythonEnginePath,
} from './services/pythonEnvironment.js'

let mainWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    frame: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const developmentUrl = process.env.VITE_DEV_SERVER_URL

  if (developmentUrl) {
    void mainWindow.loadURL(developmentUrl)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.once(
    'closed',
    () => {
      /*
      * Seng mandekno proses e python
      * sak wis e aplikasi ditutup.
      */
      jobManager.cancelAll()
      mainWindow = null
    },
  )

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedDevelopmentUrl = developmentUrl && url.startsWith(developmentUrl)
    const allowedLocalFile = !developmentUrl && url.startsWith('file://')

    if (!allowedDevelopmentUrl && !allowedLocalFile) {
      event.preventDefault()
    }
  })
}

function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize-toggle', () => {
    if (!mainWindow) return false

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return false
    }

    mainWindow.maximize()
    return true
  })
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('window:close', () => mainWindow?.close())
}

function registerApplicationHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle('dialog:open-pdf', async () => {
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Buka PDF',
      properties: ['openFile'],
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    return {
      filePath,
      fileName: path.basename(filePath),
    }
  })

  ipcMain.handle('file:read-pdf', async (_event, filePath: string) => {
    if (path.extname(filePath).toLowerCase() !== '.pdf') {
      throw new Error('File yang dipilih bukan PDF.')
    }

    const buffer = await readFile(filePath)
    return new Uint8Array(buffer)
  })

  ipcMain.handle(
    'file:read-image-data-url',

    async (
      _event,
      filePath: unknown,
    ): Promise<string> => {
      if (
        typeof filePath !==
          'string' ||
        !filePath
      ) {
        throw new Error(
          'Path gambar tidak valid.',
        )
      }

      const extension =
        path
          .extname(filePath)
          .toLocaleLowerCase()

      const mimeTypes:
        Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
        }

      const mimeType =
        mimeTypes[extension]

      if (!mimeType) {
        throw new Error(
          'Format gambar tidak didukung.',
        )
      }

      const buffer =
        await readFile(filePath)

      return (
        `data:${mimeType};base64,` +
        buffer.toString('base64')
      )
    },
  )
}

function registerPythonHandlers(): void {
  ipcMain.handle('python:health-check', async () => {
    const python = getPythonCommand()
    const scriptPath = getPythonEnginePath()

    return new Promise((resolve, reject) => {
      const child = spawn(python.command, [...python.args, scriptPath, '--health-check'], {
        windowsHide: true,
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8')
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8')
      })

      child.once('error', (error) => reject(error))
      child.once('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Python berhenti dengan kode ${code}`))
          return
        }

        try {
          resolve(JSON.parse(stdout.trim()))
        } catch {
          reject(new Error('Respons Python bukan JSON yang valid.'))
        }
      })
    })
  })
}

app.whenReady().then(() => {
  registerWindowHandlers()
  registerApplicationHandlers()
  registerPythonHandlers()
  registerJobHandlers()
  registerFileDialogHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
