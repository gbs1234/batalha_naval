const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { calcularTrajetoria } = require('./balistica.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

console.log("SERVIDOR ATIVO");

console.log("SERVIDOR INICIADO AGORA:", Date.now());

let animAtual = null;

let alvo = {
    x: 30000, 
    z: 25000,
    vx: -18,
    vz: 0,
    ultimaAtualizacao: Date.now()
};

// --- O CORAÇÃO DA TELEMETRIA ---
setInterval(() => {
    let agora = Date.now();
    let dt = (agora - alvo.ultimaAtualizacao) / 1000;
    
    alvo.x += alvo.vx * dt;
    //alvo.z += alvo.vz * dt;
    alvo.ultimaAtualizacao = agora;

    let distReal = Math.sqrt(alvo.x**2 + alvo.z**2);
    let azimuteReal = Math.atan2(alvo.x, alvo.z) * (180 / Math.PI);

    const dadosParaEnvio = {
        // Dados com erro (o que o aluno vê no painel)
        telemetria: {
            distancia: (distReal + (Math.random() * 40 - 20)).toFixed(0),
            azimute: (azimuteReal + (Math.random() * 0.4 - 0.2)).toFixed(1)
        },
        // Dados reais (o que o Three.js usa para desenhar)
        posicaoReal: {
            x: alvo.x,
            z: alvo.z
        }
    };

    io.to('equipe_A').emit('telemetria', dadosParaEnvio);
    io.to('equipe_B').emit('telemetria', dadosParaEnvio);
    
    // LOG NO TERMINAL: Se isso não aparecer no seu console, o loop parou.
    console.log(`[TELEMETRIA] Enviada: ${dadosParaEnvio.telemetria.distancia} m`);
}, 2000);

let jogadores = {
    A: null,
    B: null
};

io.on('connection', (socket) => {

    console.log("Cliente conectou:", socket.id);

    let equipeAtribuida;

    if (!jogadores.A) {
        jogadores.A = socket.id;
        equipeAtribuida = 'A';
    } else if (!jogadores.B) {
        jogadores.B = socket.id;
        equipeAtribuida = 'B';
    } else {
        equipeAtribuida = 'ESPECTADOR';
    }

    socket.equipe = equipeAtribuida;

    if (equipeAtribuida === 'A' || equipeAtribuida === 'B') {
        socket.join(`equipe_${equipeAtribuida}`);
    }

    console.log("Equipe atribuída:", socket.equipe);

    // 🔥 ENVIO GARANTIDO
    socket.emit('confirmarEquipe', {
        equipe: socket.equipe
    });

    socket.on('disconnect', () => {
        if (jogadores.A === socket.id) jogadores.A = null;
        if (jogadores.B === socket.id) jogadores.B = null;
        console.log(`Oficial da Equipe ${socket.equipe} desconectou.`);
    });





    socket.on('disparar', (dados) => {

        

        const params = {
            v0: parseFloat(dados.v0),
            eleva: parseFloat(dados.angulo),
            azimute: parseFloat(dados.azimute),
            massa: 871, calibre: 0.381, lat: 58.0
        };
       
        

        // 3. Executa o cálculo da trajetória
        const trajetoria = calcularTrajetoria(params);
        const impacto = trajetoria[trajetoria.length - 1];

        // 4. Calcula o erro em relação ao alvo móvel[cite: 5, 9]
        let erroX = impacto.x - alvo.x;
        let erroZ = impacto.z - alvo.z;


       

        // 6. Definição do tamanho do navio (margens de acerto)
        // Como o navio está de perfil ou de frente, vamos usar uma margem generosa para a aula
        const larguraNavio = 340;  // Metros (Eixo X - desvio lateral)
        const comprimentoNavio = 100; // Metros (Eixo Z - alcance)

        let acerto = Math.abs(erroX) < larguraNavio && Math.abs(erroZ) < comprimentoNavio;

        // 7. Envia o relatório de impacto para quem atirou[cite: 5, 9]
        io.emit('animarTiro', {  

            


            equipe: socket.equipe,
            caminho: trajetoria,   // 🔥 ESSENCIAL
            impacto: {
                x: impacto.x,
                z: impacto.z,
                erroX: erroX,
                erroZ: erroZ,
                acerto: acerto,
                equipeAtiradora: socket.equipe
            }
        });

         
    }); 
        
   
 }); 

server.listen(3000, '0.0.0.0', () => {
    console.log('⚓ Servidor Ativo em http://localhost:3000');
});