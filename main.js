import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 0, 60);

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize( window.innerWidth, window.innerHeight );
const canvas = renderer.domElement;
document.getElementById("three-canvas").appendChild(canvas);

scene.add( new THREE.AmbientLight( 0x606070 ) );
const dirLight = new THREE.DirectionalLight( 0xffffff, 1)
scene.add(dirLight);
scene.add(dirLight.target);

let yaw = 0;
let altitude = 0;
let distance = 60;


const loader = new OBJLoader();
loader.load(
    'human-skeleton.obj',
    (obj) => {
        obj.position.set(
            0,
            0,
            0
        );
        obj.scale.set(
            0.05,
            0.05,
            0.05
        );
        obj.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeRotationX(-77 * (Math.PI / 180))
        );
        scene.add(obj);
        renderer.render( scene, camera );

        const loading = document.querySelector('.loading');
        loading.classList.add('fade-out');
    }
)

const updateCam = () => {
    while (yaw >= Math.PI * 2) {
        yaw -= Math.PI * 2;
    }
    while (yaw < 0) {
        yaw += Math.PI * 2;
    }

    altitude = Math.max(-50, Math.min(50, altitude));

    distance = Math.max(10, Math.min(distance, 100));

    dirLight.position.set(
        distance * Math.cos(yaw + Math.PI / 6),
        1,
        distance * Math.sin(yaw + Math.PI / 6)
    )

    camera.position.set(
        distance * Math.cos(yaw),
        altitude,
        distance * Math.sin(yaw)
    );
    camera.lookAt(new THREE.Vector3(0, altitude, 0))
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
}

let lastMousePos = {x: 0, y: 0};
const mouseMoveHandler = (event) => {
    if (event.buttons === 1) {
        const delta = {x: event.clientX - lastMousePos.x, y: event.clientY - lastMousePos.y};
        yaw += delta.x / 100;
        
        altitude += delta.y / 10;

        updateCam();
        for (let i=0; i<4; i++) {
            document.querySelector('.explanations').children.item(i)
            .classList.remove('visible');
        }
        
    } 
    lastMousePos = {x: event.clientX, y: event.clientY};
}

renderer.domElement.addEventListener("mousemove", mouseMoveHandler);
mouseMoveHandler({
    buttons: 1,
    clientX: 0,
    clientY: 0
});

renderer.domElement.addEventListener("wheel", (event) => {
    distance -= event.deltaY / 20;
    updateCam();
})

addEventListener("resize", (event) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
});

const coordinates = [
    {
        yaw: 120 * Math.PI / 180,
        altitude: 35,
        distance: 25
    },
    {
        yaw: 0.62,
        altitude: 22.6,
        distance: 48
    },
    {
        yaw: 2.55,
        altitude: 7.5,
        distance: 24
    },
    {
        yaw: 0.18,
        altitude: -7.2,
        distance: 36
    }
]

let target = undefined;
let animationDuration = undefined;
let lastCoord = {
    yaw: 0,
    distance: 0,
    altitude: 0
};

let clicked = 0;

let lastTime = undefined;
let elapsed = 0;
function focusToOrgan(idx) {
    target = coordinates[idx];
    animationDuration = 500;
    
    lastCoord = {
        yaw: yaw,
        distance: distance,
        altitude: altitude
    };
    lastTime = undefined;
    elapsed = 0;

    const domElement = document.querySelector('.organ-list').children.item(idx);
    domElement.classList.add('selected');
    if (clicked < 4) {
        clicked++;
    }

    for (let i=0; i<4; i++) {
        document.querySelector('.explanations').children.item(i)
        .classList.remove('visible');
    }
    document.querySelector('.explanations').children.item(idx)
    .classList.add('visible');

    const progressBar = document.querySelector('.organ-list').children.item(4);
    progressBar.style.width = `${(clicked / 4) * 100 }%`;

    requestAnimationFrame(animate);
}

for (let i=0; i<4; i++) {
    document.querySelector('.organ-list').children.item(i)
    .addEventListener('click', () => focusToOrgan(i));
}


function animate(now) {
    if (elapsed < animationDuration) {
        requestAnimationFrame(animate);
    } else {
        lastTime = undefined;
        elapsed = 0;
    }
    if (!lastTime) {
        lastTime = now;
        return;
    }
    
    elapsed += now - lastTime;
    const coordinateDelta = {
        yaw: target.yaw - lastCoord.yaw,
        altitude: target.altitude - lastCoord.altitude,
        distance: target.distance - lastCoord.distance
    };
    
    yaw = lastCoord.yaw + (coordinateDelta.yaw * Math.pow((elapsed / animationDuration), 2));
    altitude = lastCoord.altitude + (coordinateDelta.altitude * Math.pow((elapsed / animationDuration), 2));
    distance = lastCoord.distance + (coordinateDelta.distance * Math.pow((elapsed / animationDuration), 2));

    updateCam();

    lastTime = now;
}