// public/script.js - Versão Consolidada e Estabilizada

// 1. Inicialização do Socket.io
const socket = io();

let minhaEquipe = null;

socket.on('confirmarEquipe', (data) => {
    minhaEquipe = data.equipe; // 'A' ou 'B'
    console.log("Minha equipe:", minhaEquipe);
});

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

// --- 3. LÓGICA DE COMUNICAÇÃO (TELEMETRIA E EVENTOS) ---

socket.on('connect', () => {
    console.log("Conectado ao servidor! ID:", socket.id);
});

 


// Escuta a telemetria do alvo vinda do servidor
socket.on('telemetria', (dados) => {

    if (!alvoAtivo) return;

    // 1. Atualização do Texto (Interface do Aluno)
    // Agora acessamos através de dados.telemetria
    const distParaPainel = parseFloat(dados.telemetria.distancia);
    const aziParaPainel = dados.telemetria.azimute;

    const logElement = document.getElementById('log-telemetria');
    if (logElement) {
        logElement.innerHTML = 
            `🔭 DISTÂNCIA: ${(distParaPainel / 1000).toFixed(2)} Km<br>🧭 AZIMUTE: ${aziParaPainel}°` + 
            `<hr>` + historicoAlertas;
    }

    // 2. Atualização do Modelo 3D (Visual do Campo de Batalha)
    // Usamos a posição real enviada pelo servidor para um movimento suave
    if (dados.posicaoReal) {
        // O navio desliza suavemente no eixo X (Leste-Oeste) 
        // e mantém o Z (Norte) sem a oscilação do ruído aleatório
        alvoMesh.position.x = dados.posicaoReal.x;
        alvoMesh.position.z = dados.posicaoReal.z;
    }
});



// Configuração do botão de disparo
const btnDisparar = document.getElementById('btn-disparar');
if(btnDisparar) {
    btnDisparar.addEventListener('click', () => {
        const payload = {
            equipe: 'alfa',
            v0: document.getElementById('v0').value,
            angulo: document.getElementById('angulo').value,
            azimute: document.getElementById('azimute').value
        };
        socket.emit('dispar', payload);
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