// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createForm, initFormEvent } from './form.js';
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
    setScene(scene);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 0.1);

    // mouse control
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enablePan = false;
    controls.zoomSpeed = 10;
    controls.enableZoom = false;
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
    fetch(`/form_update/?image_id=${images[index].id}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(json => {
        if (json.data) {
            const infoDatas = json.data;
            infoDatas.forEach(info => {
                const marker = createMarker(info);
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


function createMarker(info) {
    const textureLoader = new THREE.TextureLoader();
    const iconTexture = textureLoader.load('/static/map/svg/info-circle-fill.svg');
    const spriteMaterial = new THREE.SpriteMaterial({ map: iconTexture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.4,0.4,0);
    sprite.position.set(info.position.x, info.position.y, info.position.z);
    sprite.userData = {info};
    clickEventToSprite(sprite);
    
    
    scene.add(sprite);
    setScene(scene);
    return sprite;
}


function clickEventToSprite(sprite) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick(e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(sprite);
        if (intersects.length > 0) {
            if (sprite.userData.isInfoBoxOpen) return;

            sprite.userData.isInfoBoxOpen = true;

            const { info, } = sprite.userData;
            showInfoBox(info, sprite);
        }
    }
    // 移除之前的事件监听器，避免重复添加
    if (sprite.onClickHandler) {
        window.removeEventListener('click', sprite.onClickHandler);
    }

    // 绑定新的事件监听器
    sprite.onClickHandler = onClick;
    window.addEventListener('click', sprite.onClickHandler);
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
    infoDiv.classList = "container"
    infoDiv.style.pointerEvents = 'auto';

    const infoForm = document.createElement('div');
    infoForm.innerHTML = createForm(info);
    infoDiv.appendChild(infoForm);


    const infoObj = new CSS2DObject(infoDiv);
    infoObj.position.copy(sprite.position);


    scene.add(infoObj);
    setScene(scene);

    requestAnimationFrame(() => {
        initFormEvent(sprite.position, infoObj, index, info);
        sprite.userData.showInfoBox = false;
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
    setPointerConctrols(pointerControls);
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
        infostatus = false;
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

    const pointDiv = document.createElement('div');
    pointDiv.innerHTML = `   
            <i class="bi bi-info-circle-fill text-warning fs-3"></i>
        `
    pointDiv.style.zIndex = '10';
    pointDiv.style.cursor = 'pointer';
    pointDiv.style.pointerEvents = 'auto';

    const pointObj = new CSS2DObject(pointDiv);
    pointObj.position.copy(position);
    

    // 创建信息框
    const infoDiv = document.createElement('div');
    // infoDiv.style.position = 'absolute';
    infoDiv.style.padding = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    infoDiv.style.color = 'white';
    infoDiv.style.borderRadius = '10px';
    infoDiv.classList = "container"
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

    // 设置偏移量的大小
    const offsetDistance = -3; // 可以根据需要调整

    // 计算信息框的位置
    const infoPosition = new THREE.Vector3().copy(position);
    // .add(cameraRight.multiplyScalar(offsetDistance));
    infoObj.position.copy(infoPosition);
    scene.add(infoObj);
    scene.add(pointObj);
    requestAnimationFrame(() => {
        initFormEvent(pointObj, infoObj, index, info);
    });
    pointerControls.unlock();

}

function createButton(text, position, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.position = 'fixed';
    button.classList = 'btn btn-outline-info';
    button.style.width = '100px';
    button.style.height = '50px';
    // button.style.transform = 'translateY(-50%)';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';
    button.style.zIndex = 1000;
    // button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    // button.style.color = 'white';
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
    document.body.appendChild(button); // 将按钮添加到页面上，而不是场景中

    return button;
}

function updateButton() {
    // 清除现有按钮
    buttons.forEach(b => {
        scene.remove(b);
    });
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

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

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

export { createMarker, clickEventToSprite, clearMarkers }