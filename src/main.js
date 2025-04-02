const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const writeXlsxFile = require('write-excel-file/node');
const started = require('electron-squirrel-startup');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let mainWindow;
const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,   // Enable context isolation
            sandbox: true,            // Enable sandboxing
            nodeIntegration: false,   // Disable node integration
            enableRemoteModule: false, // Disable deprecated remote module
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle IPC Main for file chooser
ipcMain.handle('open-file-chooser', async (event, selectDirectory = false) => {
    const properties = selectDirectory ? ['openDirectory'] : ['openFile'];

    const result = await dialog.showOpenDialog(mainWindow, {
        title: selectDirectory ? 'Select a directory' : 'Select a file',
        buttonLabel: selectDirectory ? 'Choose Directory' : 'Choose File',
        properties: properties, // Dynamically determine whether to select file or directory
    });

    if (result.canceled) {
        return null; // User canceled the dialog
    }

    return result.filePaths[0]; // Return the selected file or directory path
});

// Handle IPC Main for reading excel files in a directory
ipcMain.handle('read-excel-files', async (event, dir) => {
    try {
        if (!dir) {
            return { success: false, message: 'No directory provided.' };
        }

        // Read all files in the directory
        const files = fs.readdirSync(dir);

        // Filter to include only .xlsx files (this library doesn't support .xls)
        const excelFiles = files.filter(file =>
            ['.xlsx'].includes(path.extname(file))
        );

        if (excelFiles.length === 0) {
            return { success: false, message: 'No Excel files found in the directory.' };
        }

        // Read the Excel files and map their contents
        const data = [];
        for (const file of excelFiles) {
            const filePath = path.join(dir, file); // Get the absolute path of the file
            try {
                // Use `readXlsxFile` to read the file
                const rows = await readXlsxFile(filePath);
                data.push({
                    fileName: file,
                    rows, // Array of rows with each row being an array of cells
                });
            } catch (error) {
                console.error(`Error reading file ${filePath}: ${error.message}`);
                return {
                    success: false,
                    message: `Error reading file ${filePath}: ${error.message}`,
                };
            }
        }

        return { success: true, data: data };
    } catch (error) {
        return { success: false, message: `Error processing directory: ${error.message}` };
    }
});

// Handle IPC Main for outputting an excel file
ipcMain.handle('write-excel-file', async (event, dir, data) => {
    try {
        if (!dir) {
            return {success: false, message: 'No directory provided.'};
        }

        const filePath = dir + "/output.xlsx";
        const parsedData = JSON.parse(data);
        console.log(data);
        console.log(parsedData);
        console.log(filePath);

        const data1 = parsedData[0];
        console.log(data1);
        const data2 = parsedData[1];
        const data3 = parsedData[2];
        const data4 = parsedData[3];
        const data5 = parsedData[4];

        await writeXlsxFile([data1, data2, data3, data4, data5], {
            //columns: [columns1, columns2], // (optional)
            sheets: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            filePath: filePath
        });

        return { success: true, message: 'Output file saved successfully.' };
    } catch (error) {
        return {success: false, message: `Error processing directory: ${error.message}`};
    }
});