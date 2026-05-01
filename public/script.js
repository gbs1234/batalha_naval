// public/script.js - Versão Consolidada e Estabilizada

// 1. Inicialização do Socket.io
const socket = io();

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
    const dist = parseFloat(dados.distancia);
    const az = (parseFloat(dados.azimute) * Math.PI) / 180;
    
    // Atualiza posição visual do alvo
    alvoMesh.position.x = dist * Math.sin(az);
    alvoMesh.position.z = dist * Math.cos(az);
    
    // Atualiza o painel de texto para o aluno
    const painel = document.getElementById('log-telemetria');
    if(painel) {
        painel.innerHTML = `🔭 TELÊMETRO: <br> Distância: ${dados.distancia}m <br> Azimute: ${dados.azimute}°`;
    }
});

// Escuta o relatório de erro após o impacto
socket.on('relatorioImpacto', (res) => {
    alert(`RELATÓRIO DE IMPACTO:\n----------------------\nImpacto em: X:${res.x} Z:${res.z}\nErro lateral (Coriolis/Vento): ${res.erroX}m\nErro alcance (Arrasto): ${res.erroZ}m\nTempo de voo real: ${res.tempoVoo}s`);
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
        socket.emit('disparar', payload);
        console.log("Disparo executado:", payload);
    });
}

// --- 4. ANIMAÇÃO DA TRAJETÓRIA EM TEMPO REAL ---

socket.on('animarTiro', (dados) => {
    const pontos = dados.caminho;
    
    // Projétil (Esfera amarela)
    const projetil = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    scene.add(projetil);

    // Linha da Trajetória (Rastro)
    const materialLinha = new THREE.LineBasicMaterial({ color: 0xffaa00 });
    const geometriaLinha = new THREE.BufferGeometry();
    const linha = new THREE.Line(geometriaLinha, materialLinha);
    scene.add(linha);

    let i = 0;
    let historicoPontos = [];

    // Execução sincronizada com o passo de tempo da física (0.1s)
    const temporizador = setInterval(() => {
        if (i >= pontos.length) {
            clearInterval(temporizador);
            setTimeout(() => { 
                scene.remove(projetil); 
            }, 3000); // Remove o projétil 3s após o impacto
            return;
        }

        const p = pontos[i];
        projetil.position.set(p.x, p.y, p.z);
        
        // Desenha o rastro
        historicoPontos.push(new THREE.Vector3(p.x, p.y, p.z));
        geometriaLinha.setFromPoints(historicoPontos);
        geometriaLinha.computeBoundingSphere(); 

        i++;
    }, 100); // 100ms = 0.1s de simulação
});

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