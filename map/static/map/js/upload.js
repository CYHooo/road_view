// 获取dropbox元素
const dropbox = document.getElementById('dropbox');
const videoUploadModal = document.getElementById('videoUploadModal');
const folderInput = document.getElementById('folder');
const fileListContainer = document.getElementById('fileList');

// 通用阻止浏览器默认行为的函数
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 添加拖拽事件监听器
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropbox.addEventListener(eventName, function (e) {
        e.preventDefault();  // 必须阻止默认行为
        e.stopPropagation(); // 必须阻止事件冒泡
    });
});

// 拖拽文件进入时的样式
dropbox.addEventListener('dragover', function () {
    this.style.background = 'rgba(227, 247, 254, 0.6)';
    this.style.border = '3px dashed rgba(0,0,0, 0.7)';
    this.style.borderRadius = "30px";
    this.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                        <p style="font-size: 24px; color: gray;">
                            <i class="bi bi-file-earmark-arrow-up" style="font-size: 3rem;"></i><br>
                            Upload Files & Folder Here
                        </p>
                      </div>`;
});

// 拖拽文件离开时的样式
dropbox.addEventListener('dragleave', function (e) {
    // e.stopPropagation(); // 阻止冒泡
    e.preventDefault();
    this.style.background = '';
    this.style.border = '3px dashed gray';
    this.style.borderRadius = "30px";
    this.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                        <p style="font-size: 24px; color: gray;">
                            <i class="bi bi-filetype-mp4" style="font-size: 3rem;"></i><br>
                            Drag & Drop to Upload File
                        </p>
                      </div>`;
});

// 文件被放下时处理文件
dropbox.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation(); // 阻止冒泡
    const items = e.dataTransfer.items;
    const promises = [];

    if (items) {
        // 使用 DataTransferItemList 接口
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const entry = items[i].webkitGetAsEntry();
                if (entry) {
                    promises.push(readAllEntries(entry));
                }
            }
        }

        Promise.all(promises).then(results => {
            const files = results.flat(Infinity);
            if (files.length > 0) {
                updateFileList(files);
            } else {
                alert('未找到任何 .mp4 文件');
            }
        });
    }
    
    this.style.background = '';
    this.style.border = '3px dashed gray';
    this.style.borderRadius = "30px";
    this.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                        <p style="font-size: 24px; color: gray;">
                            <i class="bi bi-filetype-mp4" style="font-size: 3rem;"></i><br>
                            Drag & Drop to Upload File
                        </p>
                      </div>`;
});

function readAllEntries(entry) {
    return new Promise((resolve) => {
        if (entry.isFile) {
            entry.file(file => {
                if (file.name.toLowerCase().endsWith('.mp4')) {
                    resolve([file]);
                } else {
                    resolve([]);
                }
            });
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const entries = [];

            const readEntries = () => {
                dirReader.readEntries(results => {
                    if (!results.length) {
                        // 所有子条目读取完成
                        const promises = entries.map(readAllEntries);
                        Promise.all(promises).then(files => {
                            resolve(files.flat());
                        });
                    } else {
                        entries.push(...results);
                        readEntries();
                    }
                });
            };

            readEntries();
        }
    });
}


// button upload files
document.getElementById('files').addEventListener('change', function (e) {
    handleFileSelection(e.target.files);
});
// button upload folder
document.getElementById('folder').addEventListener('change', function (e) {
    handleFolderSelection(e.target.files);
});

// init file info list
videoUploadModal.addEventListener('hidden.bs.modal', function () {
    const fileListContainer = document.querySelector('#fileList');
    if (fileListContainer) {
        fileListContainer.innerHTML = '';
    }
    
    const fileInput = document.getElementById('folder');
    if (fileInput) {
        fileInput.value = '';
    }
});

// button files upload
function handleFileSelection(files) {
    if (files.length > 0) {
        updateFileList(files);
    } else {
        alert('No file Selected, Please Check Again.');
    }
}

// button folder upload
function handleFolderSelection(files) {
    const mp4Files = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.mp4')) {
            mp4Files.push(file);
        }
    }

    if (mp4Files.length > 0) {
        updateFileList(mp4Files);
    } else {
        alert('未找到任何 .mp4 文件，请选择包含 .mp4 文件的文件夹。');
    }
}


// 创建固定表头的表格
function createFixedHeaderTable(files) {
    // 创建外层容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.style.cssText = `
        position: relative;
        max-height: 300px;
    `;

    // 创建表头容器
    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    headerContainer.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #fff;
    `;

    // 创建表头表格
    const headerTable = document.createElement('table');
    headerTable.className = 'table table-bordered mb-0';
    headerTable.innerHTML = `
        <thead>
            <tr>
                <th style="width: 5%">#</th>
                <th style="width: 45%">File Name</th>
                <th style="width: 35%">Process</th>
                <th style="width: 15%">File Size</th>
            </tr>
        </thead>
    `;
    headerContainer.appendChild(headerTable);

    // 创建内容容器
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'body-container';
    bodyContainer.style.cssText = `
        overflow-y: auto;
        max-height: calc(300px - 42px); /* 减去表头高度 */
    `;

    // 创建内容表格
    const bodyTable = document.createElement('table');
    bodyTable.className = 'table table-striped table-bordered mb-0';
    
    // 创建tbody
    const tbody = document.createElement('tbody');
    files.forEach((file, index) => {
        const row = document.createElement('tr');
        row.className = 'file-item';
        row.fileReference = file;

        row.innerHTML = `
            <td style="width: 5%">${index + 1}</td>
            <td style="width: 45%">
                <div class="file-icon text-primary">
                    <i class="bi bi-filetype-mp4"></i>
                    ${file.name}
                </div>
            </td>
            <td style="width: 35%">
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated"
                         role="progressbar"
                         aria-valuenow="0"
                         aria-valuemin="0"
                         aria-valuemax="100"
                         style="width: 0%">0%</div>
                </div>
            </td>
            <td style="width: 15%" class="text-secondary">${formatBytes(file.size)}</td>
        `;
        tbody.appendChild(row);
    });

    bodyTable.appendChild(tbody);
    bodyContainer.appendChild(bodyTable);

    // 添加滚动同步
    bodyContainer.addEventListener('scroll', () => {
        headerTable.style.transform = `translateX(-${bodyContainer.scrollLeft}px)`;
    });

    // 组装最终的表格
    tableContainer.appendChild(headerContainer);
    tableContainer.appendChild(bodyContainer);

    return tableContainer;
}

// 更新文件列表
function updateFileList(files) {
    fileListContainer.innerHTML = '';
    files = Array.from(files);

    if (files.length > 0) {
        // 已经只包含 .mp4 文件，不再需要检查
        fileListContainer.appendChild(createFixedHeaderTable(files));
    } else {
        alert('Only .mp4 type file support');
    }
}

// file size
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0: decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// file list loading
// function handleFileInput(event, files = event.dataTransfer.items) {
//     event.preventDefault();
//     const items = event.dataTransfer ? event.dataTransfer.items : [];
//     const promises = [];

//     if (items.length) {
//         for (let i = 0; i < items.length; i++) {
//             let entry = items[i].webkitGetAsEntry();
//             if (entry) {
//                 promises.push(readEntry(entry));
//             }
//         }
//     } else {
//         files = Array.from(files);
//         files.forEach(file => promises.push(Promise.resolve([file])));
//     }

//     Promise.all(promises).then(results => {
//         const allFiles = results.flat(Infinity);
//         updateFileList(allFiles);
//     });
// }

function handleFileInput(event) {
    event.preventDefault();
    const promises = [];

    if (event.dataTransfer && event.dataTransfer.items) {
        // 处理拖放文件
        const items = event.dataTransfer.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const entry = items[i].webkitGetAsEntry();
                if (entry) {
                    promises.push(readEntry(entry));
                }
            }
        }

        Promise.all(promises).then(results => {
            const allFiles = results.flat(Infinity);
            updateFileList(allFiles);
        });
    } else if (event.target && event.target.files) {
        // 处理通过文件输入选择的文件
        const files = event.target.files;
        const mp4Files = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.toLowerCase().endsWith('.mp4')) {
                mp4Files.push(file);
            }
        }

        if (mp4Files.length > 0) {
            updateFileList(mp4Files);
        } else {
            alert('Not found .mp4 file. Please check upload foler again.');
        }
    }
}


function readEntry(entry) {
    if (entry.isFile) {
        return new Promise(resolve => {
            entry.file(file => {
                if (file.name.toLowerCase().endsWith('.mp4')) {
                    resolve([file]);
                } else {
                    resolve([]);
                }
            });
        });
    } else if (entry.isDirectory) {
        let dirReader = entry.createReader();
        return new Promise(resolve => {
            const entries = [];
            const readEntries = () => {
                dirReader.readEntries(results => {
                    if (!results.length) {
                        // 递归处理目录中的所有条目
                        Promise.all(entries.map(readEntry)).then(files => resolve(files.flat(Infinity)));
                    } else {
                        entries.push(...results);
                        readEntries();
                    }
                });
            };
            readEntries();
        });
    }
}

// video submit
const MAX_SIMULTANEOUS_UPLOADS = 1; // max file queue => 4
let uploadQueue = [];
let activeUploads = 0;
let fileReader = new FileReader();
const form = document.getElementById('videoForm');
const videoUploadURL = form.getAttribute('data-url');

// check uploading video queue
function startUploads() {
    const files = document.querySelectorAll('#fileList .file-item');

    files.forEach(fileItem => {
        const progressBarElement = fileItem.querySelector('.progress');
        progressBarElement.style.display = "block";
        const fileItemIcon = fileItem.querySelector('.bi');
        if (activeUploads < MAX_SIMULTANEOUS_UPLOADS) {
            uploadFile(fileItem.fileReference, progressBarElement, fileItemIcon);
        } else {
            uploadQueue.push({ file: fileItem.fileReference, progressBar: progressBarElement, icon: fileItemIcon});
        }
    });
}

// files slice to 1MB
function uploadFile(file, progressBar, icon) {
    let offset = 0;
    const CHUNK_SIZE = 1024*1024; // 1MB

    function uploadChunk() {
        if (offset >= file.size) {
            console.log('Upload complete for: ' + file.name);
            activeUploads--;
            if (uploadQueue.length > 0 && activeUploads < MAX_SIMULTANEOUS_UPLOADS) {
                const nextUpload = uploadQueue.shift();
                uploadFile(nextUpload.file, nextUpload.progressBar, nextUpload.icon);
            }
            return;
        }

        const chunkSize = Math.min(CHUNK_SIZE, file.size - offset);
        const chunk = file.slice(offset, offset + chunkSize);
        const formData = new FormData();
        formData.append('fileChunk', chunk);
        formData.append('fileName', file.name);
        formData.append('fileType', file.name.substr(file.name.lastIndexOf('.')));
        formData.append('totalSize', file.size);
        formData.append('offset', offset);

        let csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', videoUploadURL, true);
        xhr.setRequestHeader('X-CSRFToken', csrfToken);
        // <-- KEEP THIS CODE -->
        // xhr.upload.onprogress = function(event) {
        //     if (event.lengthComputable) {
        //         const totalProgress = (offset + event.loaded) / file.size;
        //         const progressPercentage = Math.round(totalProgress * 100);
        //         progressBar.style.width = progressPercentage + '%';
        //     }
        // };
        xhr.onload = () => {
            if (xhr.status === 200) {
                offset += chunkSize;
                const progress = Math.floor((offset / file.size) * 100);
                // console.log(progress)
                uploadChunk();
                progressBar.querySelector('.progress-bar').style.width = progress + '%';
                progressBar.querySelector('.progress-bar').textContent = progress + '%';
                if (progress === 100) {
                    icon.className = "bi bi-check-circle-fill text-success";
                    progressBar.querySelector('.progress-bar').className = 'progress-bar progress-bar-striped bg-success';
                }else {
                    icon.className = "spinner-border spinner-border-sm text-secondary";
                }
            }else if (xhr.status !== 200) {
                offset += Infinity;
                icon.className = "bi bi-x-circle-fill text-danger";
                progressBar.querySelector('.progress-bar').style.width = 100 + '%';
                progressBar.querySelector('.progress-bar').textContent = `error ${xhr.status}:` + JSON.parse(xhr.responseText).message;
                progressBar.querySelector('.progress-bar').className = 'progress-bar progress-bar-striped bg-danger';
                uploadChunk();
            }
        };
        xhr.onloadend = () => {
            if (offset >= file.size) {
                if (uploadQueue.length === 0 && activeUploads === 0) {
                    if (xhr.status === 200) {
                        alert('업로드 완료!');
                        location.reload();
                    }else if (xhr.status !== 200) {
                        alert('실패한 파일을 확인해주세요.');
                    }
                    document.getElementById('videoSubmit').disabled = false;
                }
            }
        };

        xhr.send(formData);
    }

    activeUploads++;
    uploadChunk();
}

document.getElementById('videoForm').addEventListener('submit',function(e) {
    e.preventDefault();
    document.getElementById('videoSubmit').disabled = true;
    startUploads();
})


