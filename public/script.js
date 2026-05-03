// public/script.js - Versão Consolidada e Estabilizada

 

console.log("Iniciando Sala de Comando...");

// --- 2. CONFIGURAÇÃO DO CENÁRIO (THREE.JS) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Posicionando a câmera: Visão de perspectiva da origem (0,0)
camera.position.set(-3000, 4000, -3000); 
camera.lookAt(15000, 0, 15000);

// Grade (Grid) representando o papel quadriculado
// Deslocamos para que (0,0) seja o canto inferior esquerdo
const grid = new THREE.GridHelper(60000, 60, 0x444444, 0x222222);
grid.position.set(30000, 0, 30000); 
scene.add(grid);

let alvoAtivo = true; // Permite que a telemetria funcione imediatamente
let historicoAlertas = "";

scene.add(new THREE.AmbientLight(0xffffff, 0.9));

// Marcador do Canhão (Origem)
const canhao = new THREE.Mesh(
    new THREE.BoxGeometry(300, 300, 600),
    new THREE.MeshBasicMaterial({ color: 0x666666 })
);
canhao.position.set(0, 150, 0);
scene.add(canhao);

// Marcador do Alvo (Bolinha Vermelha Móvel)
const alvoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(200),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(alvoMesh);


// Configuração do botão de disparo
const btnDisparar = document.getElementById('btn-disparar');
if(btnDisparar) {
    btnDisparar.addEventListener('click', () => {
        const payload = {
            equipe: 'alfa',
            v0: document.getElementById('v0')?.value || 802,
            angulo: document.getElementById('angulo').value,
            azimute: document.getElementById('azimute').value
        };
        socket.emit('disparar', payload);
        console.log("Disparo executado:", payload);
    });
}

// --- 4. ANIMAÇÃO DA TRAJETÓRIA EM TEMPO REAL ---


 
// Loop de Renderização
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ajuste de redimensionamento da janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});