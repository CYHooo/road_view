// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createForm, initFormEvent } from './form2.js';
import { setScene, setPointerConctrols, setMarkers } from './param.js';

let camera,controls;
let renderer;
let labelRenderer;
let scene;
let box;
let index = 0;
let gui, conf;
let pointerControls;
let infostatus = false;
let csrftoken;
let markers = [];
const buttons = [];
const tweenGroup = new Group();

let sprites = [];
let mobileCaptureBtn;

// 检查设备是否移动设备
function isMobileDevice() {
    // 触屏检测
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!hasTouch) return false;

    // 交互方式
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasMouse = window.matchMedia('(any-hover: hover)').matches;
  
    // 综合判断
    return (
      !hasMouse || isCoarsePointer
    );
}

console.log({
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasMouse: window.matchMedia('(any-hover: hover)').matches,
    isMobile: isMobileDevice()
});

init();

window.addEventListener('mousemove', (e) => {
    const container = document.getElementById('container');
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    let isAnyHovered = false;

    // 检查所有 sprite 是否被鼠标悬停
    sprites.forEach(sprite => {
        const intersects = raycaster.intersectObject(sprite);
        if (intersects.length > 0) {
            isAnyHovered = true;
            sprite.material.color.set('rgb(240,128,128)');
            sprite.scale.set(0.6,0.6,0.6);
        } else {
            sprite.scale.set(0.4,0.4,0.4);
            sprite.material.color.set('rgb(0,192,144)');
        }
    });
    // const intersected = sprites.some(sprite => {
    //     const intersects = raycaster.intersectObject(sprite);
    //     return intersects.length > 0;
    // });

    // 根据检测结果设置 cursor
    container.style.cursor = isAnyHovered ? 'pointer' : 'auto';
});

function init() {
    const container = document.getElementById('container');

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
        
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( containerWidth, containerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    // info div style
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerWidth, containerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    labelRenderer.domElement.style.zIndex = '1'; // 确保在 canvas 之上
    labelRenderer.domElement.style.pointerEvents = 'none';

    container.appendChild(labelRenderer.domElement);

    scene = new THREE.Scene();
    setScene(scene);
    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 100);
    camera.position.set(0, 0, 0.1);

    // mouse control
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = false;
    controls.zoomSpeed = 10;
    controls.enableZoom = false;
    controls.rotateSpeed = -0.5;
    // controls.maxDistance = 0.1;

    loadImage(index); // load image
    createPanel(); // set up check point panel
    updateButton(); // set up next previous button

    window.addEventListener( 'resize', onWindowResize );

}

function loadImage(index) {
    const textures = getTexturesFromAtlasFile( images[index].url, 6 );
    const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));
    // clear mark point
    clearMarkers();
    if (box) {
        box.material = materials; // 替换材质
    } else {
        // 初始化 Box
        box = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), materials);
        box.geometry.scale(10, 10, -10); // 翻转以从内部观察
        scene.add(box);
    }

    

    // GET TypeInfo data
    fetch(`/main/form_update2/?image_id=${images[index].id}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(json => {
        if (json.data) {
            const infoDatas = json.data;
            infoDatas.forEach(i => {
                const marker = createMarker(i);
                markers.push(marker);
                setMarkers(markers);
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
        removeClickEventFromSprite(marker);
        scene.remove(marker);
    });
    setMarkers(markers);
    const infoObjects = scene.children.filter(obj => obj instanceof CSS2DObject);
    infoObjects.forEach(i => scene.remove(i));

    // markers = [];
}


function createMarker(i) {
    const textureLoader = new THREE.TextureLoader();
    const iconTexture = textureLoader.load('/static/map/svg/info-circle-fill.svg');
    const spriteMaterial = new THREE.SpriteMaterial({ map: iconTexture, color: new THREE.Color("rgb(0,192,144)") });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.4,0.4,0);
    sprite.position.set(i.position.x, i.position.y, i.position.z);
    sprite.userData = {i, isInfoBoxOpen: false};
    sprites.push(sprite);
    clickEventToSprite(sprite);
    
    
    scene.add(sprite);
    setScene(scene);
    return sprite;
}


function clickEventToSprite(sprite) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(e) {
        // 实时获取容器尺寸
        const container = document.getElementById('container');
        const currentWidth = container.clientWidth;
        const currentHeight = container.clientHeight;

        // 计算相对于容器的坐标
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / currentWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / currentHeight) * 2 + 1;

        // mouse.x = (e.clientX / containerWidth) * 2 - 1;
        // mouse.y = -(e.clientY / containerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(sprite);
        if (intersects.length > 0) {
            if (sprite.userData.isInfoBoxOpen) return;
            sprite.userData.isInfoBoxOpen = true;
            showInfoBox(sprite.userData.i, sprite);
        }
    }

    // 防止重复绑定
    if (!sprite.userData.eventBound) {
        window.addEventListener('click', onClick);
        sprite.userData.eventBound = true;
        sprite.onClickHandler = onClick;
    }
}

function removeClickEventFromSprite(sprite) {
    if (sprite.onClickHandler) {
        window.removeEventListener('click', sprite.onClickHandler);
    }
}

function showInfoBox(info, sprite) {
    const infoDiv = document.createElement('div');
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    infoDiv.style.color = 'black';
    infoDiv.style.borderRadius = '10px';
    infoDiv.style.zIndex = '40';
    infoDiv.classList = "container-sm w-75";
    infoDiv.style.pointerEvents = 'auto';

    const infoForm = document.createElement('div');
    infoForm.innerHTML = createForm(info);

    // 填充数据
    Object.keys(info).forEach(key => {
        const input = infoForm.querySelector(`#${key}`);
        if (input) input.value = info[key];
    });

    infoDiv.appendChild(infoForm);
    const infoObj = new CSS2DObject(infoDiv);
    infoObj.position.copy(sprite.position);
    scene.add(infoObj);

    requestAnimationFrame(() => {
        initFormEvent(sprite.position, infoObj, index, sprite);
    });

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
    gui = new GUI( { width: 200 } );
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
    setPointerConctrols(pointerControls);
    let mobileEvent;

    if (isMobileDevice()){
        // 点击 info 启动 PointerLockControls
        mobileEvent = function (e) {
            e.preventDefault();
            blocker.style.display = 'none'; // 隐藏 blocker
            crosshair.style.display = 'block'; // 显示十字标记

            const mobileCaptureBtn = document.createElement('div');
            mobileCaptureBtn.id = 'mobileCaptureBtn';
            mobileCaptureBtn.innerHTML = '<i class="bi bi-camera"></i>';
            mobileCaptureBtn.style.position = 'fixed';
            mobileCaptureBtn.style.bottom = '10px';
            mobileCaptureBtn.style.left = '70%';
            mobileCaptureBtn.style.width = '150px';
            mobileCaptureBtn.style.height = '150px';
            mobileCaptureBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
            mobileCaptureBtn.style.color = 'white';
            mobileCaptureBtn.style.borderRadius = '50%';
            mobileCaptureBtn.style.fontSize = '50px';
            mobileCaptureBtn.style.display = 'flex';
            mobileCaptureBtn.style.justifyContent = 'center';
            mobileCaptureBtn.style.alignItems = 'center';
            mobileCaptureBtn.style.cursor = 'pointer';
            mobileCaptureBtn.style.zIndex = '5';
            mobileCaptureBtn.style.pointerEvents = 'auto';
            mobileCaptureBtn.addEventListener('click', onMouseClick);

            const mobileCancelBtn = document.createElement('div');
            mobileCancelBtn.id = 'mobileCancelBtn';
            mobileCancelBtn.innerHTML = '<i class="bi bi-box-arrow-left"></i>';
            mobileCancelBtn.style.position = 'fixed';
            mobileCancelBtn.style.top = '10px';
            mobileCancelBtn.style.left = '0%';
            mobileCancelBtn.style.transform = 'translateX(50%)';
            mobileCancelBtn.style.width = '100px';
            mobileCancelBtn.style.height = '100px';
            // mobileCancelBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
            mobileCancelBtn.style.color = 'white';
            mobileCancelBtn.style.borderRadius = '50%';
            mobileCancelBtn.style.fontSize = '50px';
            mobileCancelBtn.style.display = 'flex';
            mobileCancelBtn.style.justifyContent = 'center';
            mobileCancelBtn.style.alignItems = 'center';
            mobileCancelBtn.style.cursor = 'pointer';
            mobileCancelBtn.style.zIndex = '5';
            mobileCancelBtn.style.pointerEvents = 'auto';
            mobileCancelBtn.addEventListener('click', onMobileCancel);
            document.body.appendChild(mobileCaptureBtn);
            document.body.appendChild(mobileCancelBtn);

            info.removeEventListener('touchstart', mobileEvent);
        };
        info.addEventListener('touchstart', mobileEvent, {once: true});
    } else {
        // 点击 info 启动 PointerLockControls
        info.addEventListener('click', function () {
            pointerControls.lock();
        });
    }

    // 监听 PointerLockControls 的 lock 和 unlock 事件
    pointerControls.addEventListener('lock', function () {
        // 禁用 OrbitControls
        controls.enabled = false;
        blocker.style.display = 'none'; // 隐藏 blocker
        crosshair.style.display = 'block'; // 显示十字标记
        document.addEventListener('click', onMouseClick, {once: true});
        infostatus = false;
    });

    pointerControls.addEventListener('unlock', function () {
        if (!infostatus) {
            crosshair.style.display = 'none'; // 隐藏十字标记
            controls.enabled = true; // 恢复 OrbitControls
            updateButton();
            document.removeEventListener('click', onMouseClick, {once: true});
        }
    });
}

function onMobileCancel() {
    crosshair.style.display = 'none';
    document.getElementById('mobileCaptureBtn').remove();
    document.getElementById('mobileCancelBtn').remove();
}

function onMouseClick() {
    if (isMobileDevice()) {
        document.getElementById('mobileCaptureBtn').remove();
        document.getElementById('mobileCancelBtn').remove();
    }

    buttons.forEach(b => {
        scene.remove(b);
    });
    buttons.length = 0;
    infostatus = true;

    document.removeEventListener('click', onMouseClick);
    crosshair.style.display = 'none';
    // controls.enabled = true;
    // 获取摄像机方向
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 计算点击位置（沿摄像机方向一定距离）
    const distance = 10; // 圆点离摄像机的距离
    const position = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(distance));
    
    const textureLoader = new THREE.TextureLoader();
    const iconTexture = textureLoader.load('/static/map/svg/info-circle-fill.svg');
    const spriteMaterial = new THREE.SpriteMaterial( { map: iconTexture, color: new THREE.Color("rgb(250,188,63)") } );
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.4,0.4,0);
    sprite.position.set(position.x, position.y, position.z);
    sprite.userData.pControls = true;


    // 创建信息框
    const infoDiv = document.createElement('div');
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    infoDiv.style.color = 'white';
    infoDiv.style.borderRadius = '10px';
    infoDiv.classList = "container-sm w-75";
    infoDiv.style.zIndex = "30";
    infoDiv.style.pointerEvents = 'auto';

    const inputForm = document.createElement('div');
    inputForm.classList = 'mb-2';
    inputForm.id = 'type-form';
    inputForm.innerHTML = createForm(); // 使用导入的表单
    
    infoDiv.appendChild(inputForm);
    
    const infoObj = new CSS2DObject(infoDiv);
    const cameraDirection = new THREE.Vector3();
    pointerControls.getDirection(cameraDirection);

    // 获取摄像机的上方向
    const cameraUp = new THREE.Vector3();
    cameraUp.copy(camera.up).normalize();

    // 计算摄像机的右向量
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraUp, cameraDirection).normalize();


    // 计算信息框的位置
    const infoPosition = new THREE.Vector3().copy(position);
    infoObj.position.copy(infoPosition);
    scene.add(infoObj);
    // scene.add(pointObj);
    scene.add(sprite);
    
    requestAnimationFrame(() => {
        initFormEvent(sprite, infoObj, index, sprite);
    });

    pointerControls.unlock();

}

function createButton(text, position, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.position = 'absolute';
    button.classList = 'btn btn-outline-primary';
    button.style.width = '100px';
    button.style.height = '50px';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';
    button.style.zIndex = 1003;
    button.style.pointerEvents = 'auto';

    // 根据 position 决定按钮的具体位置
    if (position === 'left') {
        button.style.left = '10px'; // 距离屏幕左边 10px
        button.style.top = '50%'; // 居中显示
        button.style.transform = 'translateY(-50%)';
    } else if (position === 'right') {
        button.style.right = '10px'; // 距离屏幕右边 10px
        button.style.top = '50%'; // 居中显示
        button.style.transform = 'translateY(-50%)';
    }

    button.addEventListener('click', onClick);
    container.appendChild(button); // 将按钮添加到页面上，而不是场景中

    return button;
}

function updateButton() {
    // 清除现有按钮
    document.querySelectorAll('.btn').forEach(btn => btn.remove());
    buttons.length = 0;

    if (index > 0) {
        const preButton = createButton('Previous', 'left', () => transitionToImage(index - 1, -0.1));
        buttons.push(preButton);
    }

    if (index < images.length - 1) {
        const nextButton = createButton('Next', 'right', () => transitionToImage(index + 1, 0.1));
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
    const container = document.getElementById('container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
    labelRenderer.setSize(containerWidth, containerHeight);

}

function animate() {
    if (pointerControls && pointerControls.isLocked) {
        pointerControls.update();
    } 
    tweenGroup.update();
    // 更新相机矩阵
    // camera.updateMatrixWorld();
    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);
}

export { createMarker, clickEventToSprite, clearMarkers, loadImage, isMobileDevice };