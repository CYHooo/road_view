// init param
let dropFiles = [];

// 获取dropbox元素
const dropbox = document.getElementById('dropbox');
const videoUploadModal = document.getElementById('videoUploadModal');
const filesInput = document.getElementById('files');
const fileListContainer = document.getElementById('fileList');

['dragenter', 'dragover', 'dragleave', 'dragstart', 'dragend', 'drop'].forEach(eventName => {
    if (dropbox) {
        dropbox.addEventListener(eventName, function (e) {
            e.preventDefault();  // 必须阻止默认行为
        });
    }
});

// 拖拽文件进入时的样式
dropbox.addEventListener('dragover', function () {
    this.style.background = 'rgba(255,255,255, 1.0)';
    this.style.border = '3px dashed black';
    this.style.boxShadow = '3px 3px 5px 7px rgba(0,0,0,0.1)';
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
    e.preventDefault();
    this.style.background = '';
    this.style.border = '3px dashed gray';
    this.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,0)';
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
                dropFiles = [...dropFiles, ...files];
                updateFileList(dropFiles);
                this.style.display = 'none';
                fileListContainer.style.display = 'block';
            } else {
                alert('Not Found *.mp4 Files.');
            }
        });
    }
});

function initFileInput() {
    filesInput.addEventListener('change', function(e) {
        const newFiles = Array.from(this.files).filter(file => 
            file.name.toLowerCase().endsWith('.mp4') &&
            !dropFiles.some(f => f.name === file.name && f.size === file.size) // 去重
        );
        
        if (newFiles.length > 0) {
            dropFiles = [...dropFiles, ...newFiles];
            updateFileList(dropFiles);
            dropbox.style.display = 'none';
            fileListContainer.style.display = 'block';
        }
        this.value = ''; // 清空输入
    });
}

// 初始化时调用
initFileInput();

//点击事件文件上传
dropbox.addEventListener('click', function () {
    filesInput.click();
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

// 创建文件列表表格
function createFileListTable(files) {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-responsive';
    tableDiv.style.cssText = `max-height: 300px; 
                                overflow-y: auto;
                                overflow-x: hidden;
                                `;
    const table = document.createElement('table');
    table.className = 'table table-striped table-primary align-middle';
    table.style.cssText = `width: 100%;
                            justify-self: center;
                            align-items: center;
                            `;
    const filesRows = files.map((file, index) => {
        return `
            <tr>
                <th scope="row">${index + 1}</th>
                <td class="text-primary">
                    <i class="bi bi-filetype-mp4"></i>
                    ${file.name}
                    <div class="btn btn-sm border border-danger float-end delete-btn" data-index="${index}">
                        <i class="bi bi-trash3 text-danger"></i>
                    </div>
                </td>
                <td>
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        aria-valuenow="0"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style="width: 0%">0%</div>
                    </div>
                </td>
                <td class="text-secondary">${formatBytes(file.size)}</td>
            </tr>
        `;
    }).join('');

    // TODO: add a button to delete all files. 
    // TODO: 追加删除所有文件的按钮
    table.innerHTML = `
        <thead style="position:sticky; top:0; z-index:500;">
            <tr>
                <th style="width: 5%">#</th>
                <th style="width: 45%">File Name</th>
                <th style="width: 35%">Process</th>
                <th style="width: 15%">File Size</th>
            </tr>
        </thead>
        <tbody class="table-group-divider overflow-auto">
            ${filesRows}
        </tbody>
    `;
    tableDiv.appendChild(table);

    tableDiv.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const row = this.closest('tr');
            row.classList.add('delete-animation');
            setTimeout(() => {
                const index = parseInt(this.dataset.index);
                dropFiles.splice(index, 1);
                updateFileList(dropFiles);
            }, 500);
        });
    });
    return tableDiv;
    
}

// 更新文件列表
function updateFileList(files) {
    fileListContainer.innerHTML = '';
    fileListContainer.style.maxHeight = '100%';

    if (files.length > 0) {
        // 已经只包含 .mp4 文件，不再需要检查
        fileListContainer.appendChild(createFileListTable(files));
    } else {
        dropFiles = [];
        dropbox.style = '';
        dropbox.style.display = 'block';
        dropbox.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                <p class="text-box" style="font-size: 24px; color: gray;">
                    <i class="bi bi-filetype-mp4" style="font-size: 5rem;"></i><br>
                    <i class="fa-solid fa-arrow-pointer fs-6"></i> Click or <i class="fa-solid fa-file-arrow-up fs-6"></i> Drop to Upload File
                </p>
            </div>
        `;
        fileListContainer.style.display = 'none';
        fileListContainer.innerHTML = '';
        filesInput.value = '';
        if(document.getElementById('videoSubmit').disabled) {
            document.getElementById('videoSubmit').disabled = false;
        }
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
// function startUploads() {
//     const files = document.querySelectorAll('#fileList .file-item');

//     files.forEach(fileItem => {
//         const progressBarElement = fileItem.querySelector('.progress');
//         progressBarElement.style.display = "block";
//         const fileItemIcon = fileItem.querySelector('.bi');
//         if (activeUploads < MAX_SIMULTANEOUS_UPLOADS) {
//             uploadFile(fileItem.fileReference, progressBarElement, fileItemIcon);
//         } else {
//             uploadQueue.push({ file: fileItem.fileReference, progressBar: progressBarElement, icon: fileItemIcon});
//         }
//     });
// }
function startUploads() {
    const progressBars = document.querySelectorAll(`.progress-bar`);
    const icons = document.querySelectorAll(`.bi-filetype-mp4`);
    // 直接使用全局状态而非DOM
    dropFiles.forEach((file, index) => {
        const progressBar = progressBars[index];
        const icon = icons[index];
        
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
        icon.className = "bi bi-filetype-mp4";

        if (activeUploads < MAX_SIMULTANEOUS_UPLOADS) {
            uploadFile(file, progressBar, icon);
        } else {
            uploadQueue.push({ file, progressBar, icon });
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
                progressBar.style.width = progress + '%';
                progressBar.textContent = progress + '%';
                if (progress === 100) {
                    icon.className = "bi bi-check-circle-fill text-success";
                    progressBar.className = 'progress-bar progress-bar-striped bg-success';
                }else {
                    icon.className = "spinner-border spinner-border-sm text-secondary";
                }
            }else if (xhr.status !== 200) {
                offset += Infinity;
                icon.className = "bi bi-x-circle-fill text-danger";
                progressBar.style.width = 100 + '%';
                progressBar.textContent = `error ${xhr.status}:` + JSON.parse(xhr.responseText).message;
                progressBar.className = 'progress-bar progress-bar-striped bg-danger';
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


