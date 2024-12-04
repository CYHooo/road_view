import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { update } from '@tweenjs/tween.js';


let camera,controls;
let renderer;
let labelRenderer;
let scene;
let box;
let index = 0;
let gui, conf;
let pointerControls;
let infostatus = false;
// let point, info, infoDiv;
let csrftoken;
let markers = [];
const buttons = [];

const tweenGroup = new Group();


init();

function init() {
    const container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    // button div style
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    labelRenderer.domElement.style.zIndex = '1'; // 确保在 canvas 之上
    labelRenderer.domElement.style.pointerEvents = 'none';

    container.appendChild(labelRenderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 0.1);

    // mouse control
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = false;
    controls.zoomSpeed = 10;
    controls.enableZoom = true;
    controls.maxDistance = 0.1;

    loadImage(index); // load image
    createPanel(); // set up check point panel
    updateButton(); // set up next previous button

    window.addEventListener( 'resize', onWindowResize );

}

function loadImage(index) {
    const textures = getTexturesFromAtlasFile( images[index].url, 6 );
    

    const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));

    if (box) {
        box.material = materials; // 替换材质
    } else {
        // 初始化 Box
        box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
        box.geometry.scale(1, 1, -1); // 翻转以从内部观察
        scene.add(box);
    }

    // clear mark point
    clearMarkers();

    // GET TypeInfo data
    fetch(`/info_position/?image_id=${images[index].id}`)
        .then(response => response.json())
        .then(data => {
            if (data.data) {
                const typeInfos = data.data;
                typeInfos.forEach(typeInfo => {
                    const position = new THREE.Vector3(
                        typeInfo.position.x,
                        typeInfo.position.y,
                        typeInfo.position.z,
                    );
                    const text = typeInfo.text;
                    
                    const marker = createMarker(position, text);
                    markers.push(marker);
                });
            } else {
                console.log('Error', data.message)
            }
        })
        .catch(error => {
            console.error('Error fetching type info data', error);
        });
}


function clearMarkers() {
    markers.forEach(marker => {
        scene.remove(marker);
    });
    markers = [];
}


function createMarker(position, text) {
    const pointDiv = document.createElement('div');
    pointDiv.style.width = '12px';
    pointDiv.style.height = '12px';
    pointDiv.style.backgroundColor = 'red';
    pointDiv.style.borderRadius = '50%';
    pointDiv.style.zIndex = '10';
    pointDiv.style.cursor = 'pointer';
    pointDiv.style.pointerEvents = 'auto';
    // pointDiv.style.position = 'absolute';

    const point = new CSS2DObject(pointDiv);
    point.position.copy(position);
    scene.add(point);

    pointDiv.addEventListener('click', () => showInfoBox(pointDiv, position, text));

    return point;
}

function showInfoBox(pointDiv, position, text) {
    const infoDiv = document.createElement('div');
    // infoDiv.style.position = 'absolute';
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    infoDiv.style.color = 'black';
    infoDiv.style.borderRadius = '10px';
    infoDiv.style.zIndex = '10';
    infoDiv.style.width = '250px';
    infoDiv.style.height = '150px';
    infoDiv.style.pointerEvents = 'auto';

    pointDiv.style.pointerEvents = 'none';

    const textDiv = document.createElement('div');
    textDiv.classList = "form-floating mb-3";
    textDiv.innerHTML = `
        <input type="text" class="form-control" id="infoType" placeholder="label name" value="${text}" disabled>
        <label for="infoType">Label</label>
    `
    infoDiv.appendChild(textDiv);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.classList = 'btn btn-secondary';
    closeButton.style.float = 'right';
    closeButton.addEventListener('click', function() {
        scene.remove(info);
        pointDiv.style.pointerEvents = 'auto';
    });
    infoDiv.appendChild(closeButton);

    const info = new CSS2DObject(infoDiv);

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    const cameraUp = new THREE.Vector3();
    cameraUp.copy(camera.up).normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraUp, cameraDirection).normalize();

    const offsetDistance = -3;
    const infoPostion = new THREE.Vector3().copy(position).add(cameraRight.multiplyScalar(offsetDistance));

    info.position.copy(infoPostion);
    scene.add(info);
}

function getTexturesFromAtlasFile( imgURL, num ) {
    const textures = [];
    
    for (let i=0; i<num; i++) {
        textures[ i ] = new THREE.Texture();
    }

    new THREE.ImageLoader()
        .load( imgURL, (image) => {
            
            let canvas, context;
            const cropWidth = image.height;

            for (let i=0; i<textures.length; i++) {

                canvas = document.createElement( 'canvas' );
                context = canvas.getContext( '2d' );
                canvas.height = cropWidth;
                canvas.width = cropWidth;
                context.drawImage( 
                    image, 
                    cropWidth*i, 0, cropWidth, cropWidth, 
                    0, 0, cropWidth, cropWidth 
                );
                textures[ i ].colorSpace = THREE.SRGBColorSpace;
                textures[ i ].image = canvas;
                textures[ i ].needsUpdate = true;

            }
        });
    
    return textures;
}


function createPanel() {
    const gui = new GUI( { width: 150 });
    conf = {
        capture: capturePoint,
    }
    gui.add(conf, 'capture');

    gui.open();
}

function capturePoint() {
    const blocker = document.getElementById('blocker');
    const info = document.getElementById('info');
    const crosshair = document.getElementById('crosshair');

    // 清除 button 按钮
    buttons.forEach(b => {
        scene.remove(b);
    });
    buttons.length = 0;

    // 显示 blocker 和 info
    blocker.style.display = 'flex';
    info.style.display = 'flex';

    pointerControls = new PointerLockControls(camera, renderer.domElement);

    // 点击 info 启动 PointerLockControls
    info.addEventListener('click', function () {
        pointerControls.lock();
    });

    // 监听 PointerLockControls 的 lock 和 unlock 事件
    pointerControls.addEventListener('lock', function () {
        // 禁用 OrbitControls
        controls.enabled = false;
        blocker.style.display = 'none'; // 隐藏 blocker
        crosshair.style.display = 'block'; // 显示十字标记
        document.addEventListener('click', onMouseClick);
    });

    pointerControls.addEventListener('unlock', function () {
        if (!infostatus) {
            crosshair.style.display = 'none'; // 隐藏十字标记
            controls.enabled = true; // 恢复 OrbitControls
            updateButton();
            document.removeEventListener('click', onMouseClick);
        }
    });
}

function onMouseClick() {
    infostatus = true;
    document.removeEventListener('click', onMouseClick);
    // 获取摄像机方向
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 计算点击位置（沿摄像机方向一定距离）
    const distance = 10; // 圆点离摄像机的距离
    const position = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(distance));

    const pointDiv = document.createElement('div');
    pointDiv.style.width = '12px';
    pointDiv.style.height = '12px';
    pointDiv.style.borderRadius = '50%';
    pointDiv.style.backgroundColor = 'red';
    // pointDiv.style.position = 'absolute';
    pointDiv.style.zIndex = '10';
    pointDiv.style.cursor = 'pointer';
    pointDiv.style.pointerEvents = 'auto';

    const point = new CSS2DObject(pointDiv);
    point.position.copy(position);
    scene.add(point);

    // 创建信息框
    const infoDiv = document.createElement('div');
    // infoDiv.style.position = 'absolute';
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    infoDiv.style.color = 'white';
    infoDiv.style.borderRadius = '10px';
    infoDiv.style.zIndex = '10';
    infoDiv.style.width = '250px';
    infoDiv.style.height = '150px';
    infoDiv.style.pointerEvents = 'auto';

    const input = document.createElement('div');
    input.classList = 'mb-2 form-floating';
    input.innerHTML = `
        <input type="text" class="form-control" id="typeInput" placeholder="Please Input Type Name">    
        <label for="typeInput" class="text-dark">Label</label><br>
    `
    infoDiv.appendChild(input);

    const buttonGroup = document.createElement('div');
    buttonGroup.classList = 'd-grid gap-2 d-md-flex justify-content-md-end mb-3';

    const saveButton = document.createElement('button');
    saveButton.id = 'save-btn';
    saveButton.classList = "btn btn-primary me-md-2";
    saveButton.textContent = 'Save';
    saveButton.type = 'submit';

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-btn';
    cancelButton.classList = 'btn btn-secondary';
    cancelButton.textContent = 'Cancel';

    buttonGroup.appendChild(saveButton);
    buttonGroup.appendChild(cancelButton);
    infoDiv.appendChild(buttonGroup);

    const info = new CSS2DObject(infoDiv);
    const cameraDirection = new THREE.Vector3();
    pointerControls.getDirection(cameraDirection);

    // 获取摄像机的上方向
    const cameraUp = new THREE.Vector3();
    cameraUp.copy(camera.up).normalize();

    // 计算摄像机的右向量
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraUp, cameraDirection).normalize();

    // 设置偏移量的大小
    const offsetDistance = -3; // 可以根据需要调整

    // 计算信息框的位置
    const infoPosition = new THREE.Vector3().copy(position).add(cameraRight.multiplyScalar(offsetDistance));

    info.position.copy(infoPosition);
    scene.add(info);

    pointerControls.unlock();

    // 保存按钮点击逻辑
    saveButton.addEventListener('click', () => onSaveClick(point, info));

    // 取消按钮点击逻辑
    cancelButton.addEventListener('click', () => onCancelClick(point, info));
}

function onSaveClick(pointObj, infoObj) {
    infostatus = false;
    // infoDiv.style.opacity = '0';
    
    const textValue = infoObj.element.querySelector('#typeInput').value;

    const data = {
        text: textValue,
        position: {
            x: pointObj.position.x,
            y: pointObj.position.y,
            z: pointObj.position.z,
        },
        image_id: images[index].id
    }
    scene.remove(infoObj);
    csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch('/info_position/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            console.log('Data save success');
            scene.remove(pointObj);
            scene.remove(infoObj);

            const savedPoint = createMarker(pointObj.position.clone(), textValue);
            markers.push(savedPoint);
            pointerControls.lock();
        } else {
            alert('info save failed');
        }
    })
    .catch(error => {
        console.error('Error', error);
    });
    
}

function onCancelClick(pointObj, infoObj) {
    infostatus = false;
    scene.remove(pointObj);
    scene.remove(infoObj);
    
    pointerControls.lock();
}

function createButton(text, position, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.position = 'absolute';
    // button.style.top = '50%';
    button.style.transform = 'translateY(-50%)';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';
    button.style.zIndex = 10;
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    button.style.color = 'white';
    button.style.pointerEvents = 'auto';

    button.addEventListener('click', onClick);
    
    const label = new CSS2DObject(button);
    label.position.copy(position);
    scene.add(label);
    
    return label;
}

function updateButton() {
    // 清除现有按钮
    // box.children.forEach(child => {
    //     if (child instanceof CSS2DObject) {
    //         box.remove(child);
    //     }
    // });
    buttons.forEach(b => {
        scene.remove(b);
    });
    buttons.length = 0;

    if (index > 0) {
        const preButton = createButton('Previous', new THREE.Vector3(0, -0.5, 1), () => transitionToImage(index - 1, -0.1));
        buttons.push(preButton);
    }

    if (index < images.length - 1) {
        const nextButton = createButton('Next', new THREE.Vector3(0, -0.5, -1), () => transitionToImage(index + 1, 0.1));
        buttons.push(nextButton);
    }

}

function transitionToImage(targetIndex, target_z) {
    if (targetIndex < 0 || targetIndex >= images.length || targetIndex === index) {
        return; // 无效索引
    }

    // 保存当前相机状态
    const currentCameraState = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        fov: camera.fov
    };

    const currentPosition = { z: camera.position.z };
    const targetPosition = { z: camera.position.z + target_z };

    // 动画：将摄像机移动到目标位置
    new Tween(currentPosition, tweenGroup)
        .to(targetPosition, 500) // 动画时间 500ms
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.position.z = currentPosition.z;
            // camera.fov = 50;
            camera.updateProjectionMatrix();
        })
        .onComplete(() => {
            // 切换图片
            index = targetIndex; // 更新当前索引
            loadImage(index);
            updateButton(); // 更新按钮状态
            controls.update();
            // 恢复相机状态
            camera.position.copy(currentCameraState.position);
            camera.quaternion.copy(currentCameraState.quaternion);
            camera.fov = currentCameraState.fov;
            camera.updateProjectionMatrix();
        })
        .start();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
    if (pointerControls && pointerControls.isLocked) {
        // PointerLockControls 被锁定时更新
        pointerControls.update();
    } else {
        // controls.update(); // 更新 OrbitControls
    }
    tweenGroup.update();
    // 更新相机矩阵
    camera.updateMatrixWorld();
    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);

}
