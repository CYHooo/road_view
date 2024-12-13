// form.js
/**
 * 创建表单的js代码，用来记录树木状态及工作内容图片
 * file for init and create form data. 
 * Data include tree info && work images.
*/
import { scene, pointerControls, markers, setScene } from './param.js';
import { createMarker, clickEventToSprite, clearMarkers } from './view.js';

let formContainer = null;
let selectedImages = {}; // 用于保存用户选择但尚未提交的图片文件
let infostatus = true;

/**
 * 创建HTML表单格式
 * create form HTML
 * @returns {HTMLFormElement}
 */
function createForm(infoDatas = null) {
    // 创建一个包含表单布局的 HTML 字符串
    const formHTML = `
        
        <div class="container">
            <form class="border border-2 border-dark rounded-3 p-2 mb-3">
                <!-- 第一行、第二行与右侧"수목 No.(측점 수)"对齐 -->
                <div class="row text-dark text-center g-1 mb-1">
                    <!-- 左侧区域包含两行输入框 -->
                    <div class="col-8">

                        <!-- 第一行：장 소、수종 -->
                        <div class="row g-1 mb-1">
                            <div class="col-8">
                                <div class="input-group">
                                    <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">장 소</span>
                                    <input id="address" value="${infoDatas ? infoDatas.address : ''}" type="text" class="form-control" placeholder="장 소" aria-label="address">
                                </div>
                            </div>
                            <div class="col">
                                <div class="input-group">
                                    <span class="input-group-text font-monospace text-bg-dark bg-opacity-75" >수 종</span>
                                    <input id="treeType" value="${infoDatas ? infoDatas.treeType : ''}" type="text" class="form-control" placeholder="수 종" aria-label="treeType">
                                </div>
                            </div>
                        </div>

                        <!-- 第二行：흉고직경、수고、수관폭 -->
                        <div class="row g-1">
                            <div class="col-5">
                                <div class="input-group">
                                    <span class="input-group-text font-monospace text-bg-dark bg-opacity-75" >흉고직경</span>
                                    <input id="diameter" value="${infoDatas ? infoDatas.diameter : ''}" type="number" class="form-control" placeholder="흉고직경" aria-label="diameter">
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="input-group">
                                    <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">수고</span>
                                    <input id="treeHeight" value="${infoDatas ? infoDatas.treeHeight : ''}" type="number" class="form-control" placeholder="수 고" aria-label="treeHeight">
                                </div>
                            </div>
                            <div class="col">
                                <div class="input-group">
                                    <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">수관폭</span>
                                    <input id="treeWidth" value="${infoDatas ? infoDatas.treeWidth : ''}" type="number" class="form-control" placeholder="수관폭" aria-label="treeWidth">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧区域：수목 No.(측점 수) 占据两行的视觉高度 -->
                    <div class="col-4 d-flex align-items-stretch">
                        <div class="input-group">
                            <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">수목 No.<br>(측점 수)</span>
                            <input id="treeNum" value="${infoDatas ? infoDatas.treeNum : ''}" type="number" class="form-control" placeholder="측점 수" aria-label="treeNum">
                        </div>
                    </div>
                </div>

                <!-- 第三行：사용기종 -->
                <div class="row text-dark text-center g-1 mb-1">
                    <div class="col-4">
                        <div class="input-group">
                            <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">사용기종</span>
                            <input id="treeUse" value="${infoDatas ? infoDatas.treeUse : ''}" type="text" class="form-control" placeholder="사용기종" aria-label="treeUse">
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="input-group">
                            <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">측정자 소속</span>
                            <input id="workerType" value="${infoDatas ? infoDatas.workerType : ''}" type="text" class="form-control" placeholder="측정자 소속" aria-label="workerType">
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="input-group">
                            <span class="input-group-text font-monospace text-bg-dark bg-opacity-75">측정자 성명</span>
                            <input id="workerName" value="${infoDatas ? infoDatas.workerName : ''}" type="text" class="form-control" placeholder="측정자 성명" aria-label="workerName">
                        </div>
                    </div>
                </div>

                <!-- 第四行 수목사진 -->
                <div class="row text-dark text-center g-1 mb-1" >
                    <div class="col">
                        <p class="font-monospace text-bg-dark bg-opacity-75 rounded-1 m-0">수 목 사 진</p>
                    </div>
                </div>

                <!-- 전경, 동, 서, 남, 복, 사진 -->
                <!-- 图片列表 -->
                <div class="row  text-dark text-center g-1 mb-3">
                    <div class="col-5">
                        <div class="font-monospace text-bg-dark bg-opacity-75 rounded-1 mb-1">
                            <p class="m-0">전 경</p>
                        </div>

                        <!-- front image 前景预览图 -->
                        <div class="m-0" style="height:400px;">
                            <div class="border border-dark rounded-3 p-0 d-flex flex-column" style="height:100%;">
                                <div class=" btn img-placeholder d-flex flex-column justify-content-center align-items-center flex-grow-1" data-image-id="pre" style="overflow:hidden;">
                                    <img id="pre-img" style="width:90%; height:90%; opacity: ${infoDatas?.pre_img ? '1' : '0.5'};" 
                                        class="${infoDatas?.pre_img ? 'img-thumbnail object-fit-contain' : 'p-3 object-fit-contain'}" 
                                        src="${infoDatas?.pre_img ?? '/static/map/img/questionmark.png'}"/>
                                    <p style="display: ${infoDatas?.pre_img ? 'none' : 'block'}" class="m-0">
                                        사진정보 없습니다. 크릭하여 사진업로드해주에요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 东 西 南 北 预览图 -->
                    <div class="col-7">
                        <div class="font-monospace text-bg-dark bg-opacity-75 rounded-1 mb-1">
                            <p class="m-0">측정부위 4방위</p>
                        </div>

                        
                        <div class="row m-0" style="height:200px;">

                            <!-- 东 -->
                            <div class="col-6 border border-dark rounded-3 p-0 d-flex flex-column" style="height:100%;">
                                <div class=" btn img-placeholder d-flex flex-column justify-content-center align-items-center flex-grow-1" data-image-id="east" style="overflow:hidden;">
                                    <img id="east-img" style="width:90%; height:90%; opacity: ${infoDatas?.east_img ? '1' : '0.5'};" 
                                        class="${infoDatas?.east_img ? 'img-thumbnail object-fit-contain' : 'p-3 object-fit-contain'}" 
                                        src="${infoDatas?.east_img ?? '/static/map/img/questionmark.png'}"/>
                                    <p style="display: ${infoDatas?.east_img ? 'none' : 'block'}" class="m-0 fs-6"><small>
                                        사진정보 없습니다. 크릭하여 사진업로드해주에요.
                                    </small></p>
                                </div>
                                <div>
                                    <p class="m-0 text-bg-dark bg-opacity-75 rounded-1">동</p>
                                </div>
                            </div>

                            <!-- 西 -->
                            <div class="col-6 border border-dark rounded-3 p-0 d-flex flex-column" style="height:100%;">
                                <div class=" btn img-placeholder d-flex flex-column justify-content-center align-items-center flex-grow-1" data-image-id="west" style="overflow:hidden;">
                                    <img id="west-img" style="width:90%; height:90%; opacity: ${infoDatas?.west_img ? '1' : '0.5'};" 
                                        class="${infoDatas?.west_img ? 'img-thumbnail object-fit-contain' : 'p-3 object-fit-contain'}" 
                                        src="${infoDatas?.west_img ?? '/static/map/img/questionmark.png'}"/>
                                    <p style="display: ${infoDatas?.west_img ? 'none' : 'block'}" class="m-0 fs-6"><small>
                                        사진정보 없습니다. 크릭하여 사진업로드해주에요.
                                    </small></p>
                                </div>
                                <div>
                                    <p class="m-0 text-bg-dark bg-opacity-75 rounded-1">서</p>
                                </div>
                            </div>
                        </div>


                        <div class="row m-0" style="height:200px;">

                            <!-- 南 -->
                            <div class="col-6 border border-dark rounded-3 p-0 d-flex flex-column" style="height:100%;">
                                <div class=" btn img-placeholder d-flex flex-column justify-content-center align-items-center flex-grow-1" data-image-id="south" style="overflow:hidden;">
                                    <img id="south-img" style="width:90%; height:90%; opacity: ${infoDatas?.south_img ? '1' : '0.5'};" 
                                        class="${infoDatas?.south_img ? 'img-thumbnail object-fit-contain' : 'p-3 object-fit-contain'}" 
                                        src="${infoDatas?.south_img ?? '/static/map/img/questionmark.png'}"/>
                                    <p style="display: ${infoDatas?.south_img ? 'none' : 'block'}" class="m-0 fs-6"><small>
                                        사진정보 없습니다. 크릭하여 사진업로드해주에요.
                                    </small></p>
                                </div>
                                <div>
                                    <p class="m-0 text-bg-dark bg-opacity-75 rounded-1">남</p>
                                </div>
                            </div>

                            <!-- 北 -->
                            <div class="col-6 border border-dark rounded-3 p-0 d-flex flex-column" style="height:100%;">
                                <div class=" btn img-placeholder d-flex flex-column justify-content-center align-items-center flex-grow-1" data-image-id="north" style="overflow:hidden;">
                                    <img id="north-img" style="width:90%; height:90%; opacity: ${infoDatas?.north_img ? '1' : '0.5'};" 
                                        class="${infoDatas?.north_img ? 'img-thumbnail object-fit-contain' : 'p-3 object-fit-contain'}" 
                                        src="${infoDatas?.north_img ?? '/static/map/img/questionmark.png'}"/>
                                    <p style="display: ${infoDatas?.north_img ? 'none' : 'block'}" class="m-0 fs-6"><small>
                                        사진정보 없습니다. 크릭하여 사진업로드해주에요.
                                    </small></p>
                                </div>
                                <div>
                                    <p class="m-0 text-bg-dark bg-opacity-75 rounded-1">복</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>  
            </form>
            <div id="btn-group" class="d-grid gap-2 d-md-flex justify-content-md-end mb-3">
                <button id="save-btn" type="submit" class="btn btn-primary me-md-2">
                    저장
                </button>
                <button id="cancel-btn" type="close" class="btn btn-secondary">
                    취소
                </button>
            </div>
        </div>
        
    `;
    return formHTML;
}

function initFormEvent(pointObj, infoObj, index, info) {
    const placeholder = document.querySelectorAll('.img-placeholder');
    const saveButton = document.getElementById('save-btn');
    const cancelButton = document.getElementById('cancel-btn');

    placeholder.forEach(p => {
        p.addEventListener('click', () => clickForUploadImage(p))
    });
    // 保存按钮点击逻辑
    saveButton.addEventListener('click', () => onSaveClick(pointObj, infoObj, index, info));

    // 取消按钮点击逻辑
    cancelButton.addEventListener('click', () => onCancelClick(pointObj, infoObj, info));
}

function clickForUploadImage(p) {
    const imgPosition = p.getAttribute('data-image-id');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgElement = p.querySelector('img');
                const txtElement = p.querySelector('p');
                imgElement.src = e.target.result;
                imgElement.classList = 'img-thumbnail img-fluid mx-auto d-block object-fit-contain'
                imgElement.style.opacity = '1';
                if (txtElement) {
                    txtElement.style.display = 'none';
                }
                selectedImages[imgPosition] = file;
                console.log(selectedImages);
            };
            reader.readAsDataURL(file);
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function onSaveClick(pointObj, infoObj, index, info) {
    infostatus = false;
    
    const fields = [
        'address',
        'treeType',
        'diameter',
        'treeHeight',
        'treeWidth',
        'treeNum',
        'treeUse',
        'workerType',
        'workerName'
    ];

    const data = {};
    const formData = new FormData();

    // 使用循环获取表单值
    fields.forEach(field => {
        const input = infoObj.element.querySelector(`#${field}`);
        if (input) {
            data[field] = input.value;
        } else {
            data[field] = ""; // 如果不存在对应元素，可设为空或根据需求处理
        }
    });

    data.position = {
        x: pointObj.position.x,
        y: pointObj.position.y,
        z: pointObj.position.z,
    };
    data.imageId = images[index].id;

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    }
    
    for (const [key, file] of Object.entries(selectedImages)) {
        formData.append(key, file);
    }
    
    // scene.remove(infoObj);
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch('/form_update/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.log('Data save success');
            scene.remove(pointObj);
            scene.remove(infoObj);

            const savedPoint = createMarker(info);
            markers.push(savedPoint);

            if (pointerControls && pointerControls.isLocked){
                pointerControls.lock();
            }
        } else {
            alert('info save failed');
        }
    })
    .catch(error => {
        console.error('Error', error);
    });
    
}

function onCancelClick(pointObj, infoObj, info) {
    infostatus = false;
    
    // scene.remove(pointObj);
    scene.remove(infoObj);
    setScene(scene);

    clickEventToSprite(createMarker(info));
    // createMarker(info);
    

    if (pointerControls && pointerControls.isLocked){
        pointerControls.lock();
    }
    
}



export { createForm, initFormEvent, }