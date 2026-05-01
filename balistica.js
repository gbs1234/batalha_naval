// balistica.js

// Constantes Físicas
const G = 9.80;          // Aceleração da gravidade (m/s²)
const RHO = 1.225;       // Densidade do ar ao nível do mar (kg/m³)
const OMEGA = 7.2921e-5; // Velocidade angular da Terra (rad/s)

/**
 * Calcula a trajetória completa de um projétil
 * @param {Object} params - v0, anguloEleva, anguloAzimute, massa, calibre, lat
 */
function calcularTrajetoria(params) {
    let { v0, eleva, azimute, massa, calibre, lat } = params;

    // Conversão para radianos
    let theta = (eleva * Math.PI) / 180;
    let phi = (azimute * Math.PI) / 180;
    let latitudeRad = (lat * Math.PI) / 180;

    // Vetores iniciais de posição e velocidade (Sistema de Coordenadas Local)
    // x: Leste, y: Vertical, z: Norte
    let pos = { x: 0, y: 0, z: 0 };
    let vel = {
        x: v0 * Math.cos(theta) * Math.sin(phi),
        y: v0 * Math.sin(theta),
        z: v0 * Math.cos(theta) * Math.cos(phi)
    };

    let pontos = [];
    let dt = 0.1; // Passo de tempo (s)
    let tempoTotal = 0;

    // Área da seção transversal do projétil (m²)
    const area = Math.PI * Math.pow(calibre / 2, 2);
    const Cd = 0.2; // Coeficiente de arrasto típico para projéteis de artilharia

    // Loop de integração (Método de Euler)
    while (pos.y >= 0 && tempoTotal < 180) { // Limite de 3 minutos de voo
        let v_mod = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);

        // 1. Força de Arrasto (Drag)
        let Fd = 0.5 * RHO * v_mod**2 * area * Cd;
        let ax_drag = -(Fd * (vel.x / v_mod)) / massa;
        let ay_drag = -(Fd * (vel.y / v_mod)) / massa;
        let az_drag = -(Fd * (vel.z / v_mod)) / massa;

        // 2. Aceleração de Coriolis (Simplificada para o plano local)
        // a_cor = -2 * (Omega x v)
        let ax_cor = -2 * OMEGA * (vel.z * Math.sin(latitudeRad) - vel.y * Math.cos(latitudeRad));
        let ay_cor = -2 * OMEGA * (vel.x * Math.cos(latitudeRad));
        let az_cor = 2 * OMEGA * (vel.x * Math.sin(latitudeRad));

        // 3. Atualização das Velocidades
        vel.x += (ax_drag + ax_cor) * dt;
        vel.y += (-G + ay_drag + ay_cor) * dt;
        vel.z += (az_drag + az_cor) * dt;

        // 4. Atualização das Posições
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        pos.z += vel.z * dt;

        tempoTotal += dt;

        // Armazena ponto a cada 1 segundo para não sobrecarregar a rede
        if (Math.round(tempoTotal / dt) % 10 === 0) {
            pontos.push({ 
                x: pos.x, 
                y: pos.y, 
                z: pos.z, 
                vx: vel.x, // Adiciona velocidade em X
                vy: vel.y, // Adiciona velocidade em Y (altura)
                vz: vel.z,  // Adiciona velocidade em Z (alcance)
                t: tempoTotal });
        }
    }

    return pontos;
}

module.exports = { calcularTrajetoria };