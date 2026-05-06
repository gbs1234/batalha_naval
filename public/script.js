// public/script.js

console.log("Script carregado");

let tiroEmAndamento = false;

// Cria o socket
const socket = io();

// Guarda a equipe
let minhaEquipe = null;

// Conexão estabelecida
socket.on('connect', () => {
    console.log("CONECTADO:", socket.id);

    // ESSENCIAL: pede a equipe
    socket.emit('ready');
});

// Recebe a equipe do servidor
socket.on('confirmarEquipe', (data) => {
    minhaEquipe = data.equipe;

    console.log("🔥 MINHA EQUIPE:", minhaEquipe);

    // (opcional) mostrar na tela
    const painel = document.getElementById("painel-equipe");
    if (painel) {
        painel.innerText = "Equipe: " + minhaEquipe;
    }
});

// Recebe telemetria
 // 2. LOGICA DE COMUNICAÇÃO
socket.on('telemetria', (dados) => {

// 1. Verificação de segurança: se o rádio receber algo, ele sai de "espera"
    if (!dados || !alvo) return;        
    
   
        

    // Acessamos dados.telemetria porque você aninhou os dados no servidor
    const dParaTexto = dados.telemetria.distancia;
    const aParaTexto = dados.telemetria.azimute;

    document.getElementById('log-telemetria').innerHTML = 
        `🔭 DISTÂNCIA: ${(dParaTexto / 1000).toFixed(2)} Km<br>🧭 AZIMUTE: ${aParaTexto}°`;

    console.log("X real recebido:", dados.posicaoReal.x);

    if (dados.posicaoReal) {
        alvo.position.x = dados.posicaoReal.x;
        alvo.position.z = dados.posicaoReal.z;
        alvo.visible = true; // Garante que o ponto apareça
    }

    

    // Troca a mensagem de status se houver uma
    const statusRadio = document.getElementById('status-radio');
    if (statusRadio) statusRadio.innerText = "SINAL ESTÁVEL";
});


// Botão disparar
const btnDisparar = document.getElementById('btn-disparar');

if (btnDisparar) {
    btnDisparar.addEventListener('click', () => {

        const payload = {
            v0: document.getElementById('v0')?.value || 802,
            angulo: document.getElementById('angulo').value,
            azimute: document.getElementById('azimute').value
        };

        console.log("🎯 Enviando disparo:", payload);

        socket.emit('disparar', payload);
    });
}

// =============================
// 🎯 ANIMAÇÃO DO TIRO
// =============================

let trajetoriaAtual = null;
let projetilAtual = null;
let ultimoImpacto = null;
let tiroAtualId = null;


socket.on('animarTiro', (dados) => {

    if (!minhaEquipe) return;

    const alerta = document.getElementById('alerta-radar');


     // IGNORA tiros que não são seus
    if (dados.equipe !== minhaEquipe) return;
    if (trajetoriaAtual) scene.remove(trajetoriaAtual);
    if (projetilAtual) scene.remove(projetilAtual);

      //  BLOQUEIA BOTÃO
    if (btnDisparar) btnDisparar.disabled = true;

    tiroAtualId = dados.id;

    tiroEmAndamento = true;
    ultimoImpacto = null; // 
    
    
    setTextoComFade(
        document.getElementById('resultado-impacto'),
        "🚀 PROJÉTIL EM VOO..."
    );

    const pontos = dados.caminho;           
    const impacto = dados.impacto;          

    projetilAtual = new THREE.Mesh(
        new THREE.SphereGeometry(150),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    scene.add(projetilAtual);

    const geoLinha = new THREE.BufferGeometry();
    trajetoriaAtual = new THREE.Line(geoLinha, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
    scene.add(trajetoriaAtual);

    let i = 0;
    let rastro = [];

    const anim = setInterval(() => {

        if (i >= pontos.length) {
            clearInterval(anim);
            tiroEmAndamento = false;

            //  LIBERA BOTÃO
            if (btnDisparar) btnDisparar.disabled = false;

            if (ultimoImpacto) {
                mostrarImpacto(ultimoImpacto);
            }

            return;
        }

        const p = pontos[i];
        projetilAtual.position.set(p.x, p.y, p.z);

        if (p.vx !== undefined) {
            document.getElementById('val-vx').innerText = Math.round(p.vx);
            document.getElementById('val-vy').innerText = Math.round(p.vy);
            document.getElementById('val-vz').innerText = Math.round(p.vz);
        }

        rastro.push(new THREE.Vector3(p.x, p.y, p.z));
        geoLinha.setFromPoints(rastro);

        i++;

    }, 300);
});


socket.on('impacto', ({ id, impacto }) => {

      
    if (!id) return;
    
    const fuiAtacado = impacto.equipeAtiradora !== minhaEquipe;

    if (fuiAtacado) {
         const tempoSimulado = 15000; // ajuste conforme sua animação

        setTimeout(() => {
            mostrarImpacto(impacto, true);
        }, tempoSimulado);
        return;
    }

    ultimoImpacto = impacto;

    if (!tiroEmAndamento) {
        mostrarImpacto(impacto, false);
    }
        
    });


function mostrarImpacto(impacto, foiAtacado) {

    const alerta = document.getElementById('alerta-radar');
    const resultado = document.getElementById('resultado-impacto');


    if (!alerta || !resultado) return;

    if (foiAtacado) {

        const distancia = Math.sqrt(
            impacto.erroX**2 + impacto.erroZ**2
        );

        alerta.innerHTML = impacto.acerto
            ? "💥 IMPACTO DIRETO!"
            : `🌊 Impacto (${(distancia/1000).toFixed(2)} km)`;

        alerta.style.color = "red";

        setTimeout(() => alerta.innerHTML = "", 25000);
    }
    else {

        if (impacto.acerto) {
            resultado.innerHTML = "💥 ALVO DESTRUÍDO!";
        } else {
            resultado.innerHTML = `
                📍 IMPACTO:
                <br>ΔX = ${(impacto.erroX/1000).toFixed(2)} km
                <br>ΔZ = ${(impacto.erroZ/1000).toFixed(2)} km
            `;
        }
    }
}

function setTextoComFade(elemento, novoTexto) {
    if (!elemento) return;

    // inicia fade out
    elemento.classList.add("fade-out");

    setTimeout(() => {
        elemento.innerHTML = novoTexto;

        // fade in
        elemento.classList.remove("fade-out");
    }, 300);
}