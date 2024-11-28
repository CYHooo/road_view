import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {Tween, Group, Easing} from "@tweenjs/tween.js";

let camera,controls;
let renderer;
let labelRenderer;
let scene;
let box;
let index = 0;
const tweenGroup = new Group();

init();

function init() {
    const container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 0.01;

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;

    loadImage(index);
    
    updateButton();

    window.addEventListener( 'resize', onWindowResize );

}

function loadImage(index) {
    const textures = getTexturesFromAtlasFile( images[index], 6 );
    

    const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));

    if (box) {
        box.material = materials; // 替换材质
    } else {
        // 初始化 Box
        box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
        box.geometry.scale(1, 1, -1); // 翻转以从内部观察
        scene.add(box);
    }

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
    box.add(label);
    
    return label;
}

function updateButton() {
    // 清除现有按钮
    box.children.forEach(child => {
        if (child instanceof CSS2DObject) {
            box.remove(child);
        }
    });

    if (index > 0) {
        createButton('Previous', new THREE.Vector3(0, -0.1, 1), () => transitionToImage(index - 1, -0.1));
    }

    if (index < images.length - 1) {
        createButton('Next', new THREE.Vector3(0, -0.1, -1), () => transitionToImage(index + 1, 0.1));
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

    controls.update(); // required when damping is enabled
    tweenGroup.update();
    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);

}
