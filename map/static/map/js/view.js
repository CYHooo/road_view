import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {Tween, Group, Easing} from "@tweenjs/tween.js";

let currentIndex = 0;
let isAnimating = false;
let isDragging = false;
const tweenGroup = new Group();

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const scene = new THREE.Scene();
const canvas = document.querySelector('canvas.webgl');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sizes.width, sizes.height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0.1);

const geometry = new THREE.SphereGeometry(32,512,512);
geometry.scale(1, 1, -1); // 反转球体

let material = new THREE.MeshBasicMaterial();
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// 初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, -0.1);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableRotate = true;
controls.enableZoom = true;


function loadImage(index) {   
    const textureLoader = new THREE.TextureLoader(); 
    textureLoader.load(
        new URL(images[index], import.meta.url).href,
        (texture) => {
            console.log(`Image loaded successfully: ${images[index]}`);
            material.map = texture;
            material.needsUpdate = true;
            console.log(`Image loaded: ${images[index]}`);
        },
        undefined,
        (error) => {
            console.error(`Failed to load texture: ${images[index]}`, error);
        }
    );
    // material.map = textureLoader.load(new URL(images[index], import.meta.url).href);
    // material.needsUpdate = true;
}

// button
function createButton(text, position, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'label';
    button.style.padding = '10px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'rgba(0,0,0,0.7)';
    button.style.color = 'white';
    button.style.pointerEvents = 'auto';


    button.addEventListener('click', () => {
        console.log(`click button: ${text}`);
        onClick();
    });

    const label = new CSS2DObject(button);
    label.position.copy(position);
    sphere.add(label);
    return label;
}

function updateButtons() {
    // 清除现有按钮
    sphere.children.forEach(child => {
        if (child instanceof CSS2DObject) {
            sphere.remove(child);
        }
    });

    if (currentIndex > 0) {
        createButton('Previous', new THREE.Vector3(0, -5, 10), () => transitionToImage(currentIndex - 1, -1));
    }
    if (currentIndex < images.length -1) {
        createButton('Next', new THREE.Vector3(0, -5, -10), () => transitionToImage(currentIndex + 1, 1));
    }
}


function transitionToImage(index, target_z) {
    if (isAnimating || index < 0 || index >= images.length) {
        console.log('Transition aborted: Invalid state or index');
        return;
    }
    console.log(`Transitioning to image: ${index}`); 
    currentIndex = index; // 确保在动画开始时更新索引
    isAnimating = true;

    const currentPosition = { z: camera.position.z, fov: camera.fov }; // 当前摄像机位置和视角
    const targetPosition = { z: camera.position.z + target_z, fov: 60 }; // 目标位置和视角（模拟拉近）
    const returnPosition = { z: camera.position.z, fov: 75 }; // 返回位置和视角

    const moveToTarget = new Tween(currentPosition, tweenGroup)
        .to(targetPosition, 30) // 动画时长为 1000ms
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.position.z = currentPosition.z;
            camera.fov = currentPosition.fov;
            camera.updateProjectionMatrix();
        })
        .onComplete(() => {
            // 动画完成后切换图片
            loadImage(index);
            isAnimating = false;
            currentIndex = index; // 更新索引
            updateButtons(); // 更新按钮
        })
        .start();
}



loadImage(currentIndex);
updateButtons();



function renderLoop() {
    controls.update();
    tweenGroup.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
}

renderLoop();
