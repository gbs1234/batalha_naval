const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { calcularTrajetoria } = require('./balistica.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let jogadores = {
    A: null,
    B: null
};

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

    io.to('equipe_A').to('equipe_B').emit('telemetria', dadosParaEnvio);
    
    // LOG NO TERMINAL: Se isso não aparecer no seu console, o loop parou.
    console.log(`[TELEMETRIA] Enviada: ${dadosParaEnvio.telemetria.distancia} m`);
}, 2000);

io.on('connection', (socket) => {

    // Lógica simples de entrada em sala
    let equipeAtribuida = null;
    if (!jogadores.A) {
        jogadores.A = socket.id;
        equipeAtribuida = 'A';
    } else if (!jogadores.B) {
        jogadores.B = socket.id;
        equipeAtribuida = 'B';
    }

    if (equipeAtribuida) {
        socket.equipe = equipeAtribuida;  // 🔥 ESSENCIAL

        socket.join(`equipe_${equipeAtribuida}`);

        console.log(`Oficial da Equipe ${equipeAtribuida} conectado (ID: ${socket.id})`);

        socket.emit('confirmarEquipe', { equipe: equipeAtribuida });
    }

    // Ao desconectar, libera a vaga na equipe
    socket.on('disconnect', () => {
        if (jogadores.A === socket.id) jogadores.A = null;
        if (jogadores.B === socket.id) jogadores.B = null;
        console.log(`Oficial da Equipe ${equipeAtribuida} desconectou.`);
    });



    socket.on('disparar', (dados) => {
        const params = {
            v0: parseFloat(dados.v0),
            eleva: parseFloat(dados.angulo),
            azimute: parseFloat(dados.azimute),
            massa: 871, calibre: 0.381, lat: 58.0
        };
       
        // 2. Identificamos quem é o atirador e quem é o alvo
        const equipe = socket.equipe;  


        console.log("Equipe do disparo:", equipe);

        const equipeInimiga = equipe === 'A' ? 'B' : 'A';

        const trajetoria = calcularTrajetoria(params);

        console.log("Emitindo para:", `equipe_${equipeInimiga}`);


        // Apenas quem atirou vê o rastro para poder corrigir a mira
        socket.emit('animarTiro', { equipe: equipe, caminho: trajetoria });

        const impacto = trajetoria[trajetoria.length - 1];

        let erroX = impacto.x - alvo.x;
        let erroZ = impacto.z - alvo.z;

        // Definição do tamanho do navio (margens de acerto)
        // Como o navio está de perfil ou de frente, vamos usar uma margem generosa para a aula
        const larguraNavio = 340;  // Metros (Eixo X - desvio lateral)
        const comprimentoNavio = 100; // Metros (Eixo Z - alcance)

        let acerto = Math.abs(erroX) < larguraNavio && Math.abs(erroZ) < comprimentoNavio;

        socket.emit('relatorioImpacto', {
            x: impacto.x.toFixed(0),
            z: impacto.z.toFixed(0),
            erroX: erroX.toFixed(0),
            erroZ: erroZ.toFixed(0),
            tempoVoo: impacto.t.toFixed(1),
            acerto: acerto // Novo campo booleano
        });


        console.log(`Tentando enviar alerta para: equipe_${equipeInimiga}`);
        
        // O inimigo NÃO vê o rastro (para não saber de onde veio), 
        // mas recebe um alerta de rádio quando o projétil cai
        io.to(`equipe_${equipeInimiga}`).emit('alertaRadar', {
            msg: "⚠️ IMPACTO DETECTADO NO SETOR!",
            distanciaErro: Math.sqrt(erroX**2 + erroZ**2).toFixed(0),
             
        });


        if (acerto) {
            // Se houve acerto, avisamos TODOS (io.emit) que a batalha acabou
            io.emit('vitoria', { 
                vencedor: minhaEquipe, 
                msg: `💥 O navio da Equipe ${minhaEquipe} afundou o inimigo!` 
            });
            // Opcional: Resetar a posição do alvo para uma nova rodada após 5 segundos
            setTimeout(() => {
                alvo.x = 50000; 
                console.log("Nova rodada iniciada!");
            }, 5000);
        }


        
         
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('⚓ Servidor Ativo em http://localhost:3000');
});