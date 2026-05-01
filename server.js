const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { calcularTrajetoria } = require('./balistica.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let alvo = {
    x: 29000, 
    z: 25000,
    vx: -25,
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

    io.emit('telemetria', dadosParaEnvio);
    
    // LOG NO TERMINAL: Se isso não aparecer no seu console, o loop parou.
    console.log(`[TELEMETRIA] Enviada: ${dadosParaEnvio.telemetria.distancia} m`);
}, 2000);

io.on('connection', (socket) => {
    console.log('Oficial conectado:', socket.id);

    socket.on('disparar', (dados) => {
        const params = {
            v0: parseFloat(dados.v0),
            eleva: parseFloat(dados.angulo),
            azimute: parseFloat(dados.azimute),
            massa: 871, calibre: 0.381, lat: 58.0
        };
        const trajetoria = calcularTrajetoria(params);
        const impacto = trajetoria[trajetoria.length - 1];

        let erroX = impacto.x - alvo.x;
        let erroZ = impacto.z - alvo.z;

        // Definição do tamanho do navio (margens de acerto)
        // Como o navio está de perfil ou de frente, vamos usar uma margem generosa para a aula
        const larguraNavio = 60;  // Metros (Eixo X - desvio lateral)
        const comprimentoNavio = 200; // Metros (Eixo Z - alcance)

        let acerto = Math.abs(erroX) < larguraNavio && Math.abs(erroZ) < comprimentoNavio;

        socket.emit('relatorioImpacto', {
            x: impacto.x.toFixed(0),
            z: impacto.z.toFixed(0),
            erroX: erroX.toFixed(0),
            erroZ: erroZ.toFixed(0),
            tempoVoo: impacto.t.toFixed(1),
            acerto: acerto // Novo campo booleano
        });


        io.emit('animarTiro', { equipe: dados.equipe, caminho: trajetoria });

         
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('⚓ Servidor Ativo em http://localhost:3000');
});