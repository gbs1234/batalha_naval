# ⚓ Simulador de Batalha Naval (Socket.IO + Three.js)

Simulador interativo de tiro naval em tempo real para duas equipes, com telemetria, animação 3D e comunicação via WebSockets.

🚀 Modelagem Física do Simulador

Esta simulação separa a Observação da Operação. O aluno atua como um calculista de artilharia da WWI, onde a visualização direta é suprimida em favor da análise de dados de telemetria e plotagem em coordenadas cartesianas. O foco é a aplicação prática de vetores posição e velocidade em sistemas com forças de arrasto $ F \propto v^2$ e termos de Coriolis $−2m(\Omega \times v)$.

---

## 🎯 Objetivo

Cada equipe recebe dados de telemetria de um alvo em movimento e deve calcular o disparo correto para acertá-lo.

* 🔭 Telemetria com erro (distância e azimute)
* 🎯 Cálculo de trajetória balística
* 💥 Feedback de impacto (acerto ou erro)
* 🌐 Comunicação em tempo real com Socket.IO
* 🧠 Ideal para ensino de Física (movimento, vetores, erro experimental)

---

## 📦 Pré-requisitos

### 🔧 Node.js

Baixe e instale a versão LTS:

👉 https://nodejs.org

Verifique:

```bash
node -v
npm -v
```

---

# 💻 Instalação e Execução

---

## 🐧 Linux / macOS

### 1. Clone o repositório

```bash
git clone https://github.com/gbs1234/batalha_naval
cd batalha_naval
```

---

### 2. Instale as dependências

```bash
npm install
```

---

### 3. Execute o servidor

```bash
node server.js
```

---

### 4. Se der erro de porta ocupada

```bash
fuser -k 3000/tcp
```

---

## 🪟 Windows

### 1. Clone o repositório

Use **Git Bash**, PowerShell ou CMD:

```bash
git clone https://github.com/gbs1234/batalha_naval
cd batalha_naval
```

---

### 2. Instale as dependências

```bash
npm install
```

---

### 3. Execute o servidor

```bash
node server.js
```

---

### 4. Se der erro de porta ocupada

No PowerShell ou CMD:

```bash
netstat -ano | findstr :3000
```

Copie o PID e execute:

```bash
taskkill /PID XXXX /F
```

---

## 🌐 Uso no navegador

Abra:

```
http://localhost:3000
```

---

## 👥 Jogadores

* Abra **duas abas** do navegador
  ou
* Use dois dispositivos na mesma rede

Distribuição automática:

* Primeiro → Equipe A
* Segundo → Equipe B

---

## 🎮 Como jogar

1. Observe a telemetria
2. Ajuste:

   * velocidade inicial (v0)
   * ângulo
   * azimute
3. Clique em **Disparar**

---

## 🎯 O que acontece

* 🚀 Projétil animado (somente para quem atira)
* 🚨 Alerta de disparo inimigo
* 🌊 Impacto na água → erro
* 💥 Impacto direto → destruição
* 🔊 Sons para eventos importantes

---

## ⚠️ Regras

* Apenas dois jogadores simultâneos
* Cada jogador ajusta a elevação do canhão e o ângulo azimutal
* Após o ajuste, o jogador efetua o disparo com o objetivo de destruir o navio inimigo.

---

## 🗂 Estrutura do projeto

```
.
├── server.js
├── balistica.js
├── public/
│   ├── index.html
│   ├── script.js
│   ├── sounds/
│   └── ...
```

---

## 🧠 Conceitos abordados

* Movimento oblíquo
* Sistema de coordenadas
* Referências não inerciais
* Vetores
* Forças de arrasto
* Simulação numérica

---

## 🛠 Tecnologias

* Node.js
* Express
* Socket.IO
* Three.js

---

## 🐛 Problemas comuns

### Porta em uso

* Linux/macOS:

```bash
fuser -k 3000/tcp
```

* Windows:

```bash
netstat -ano | findstr :3000
taskkill /PID XXXX /F
```

---

### Áudio não funciona

* Clique na tela antes de interagir
* Verifique a pasta `public/sounds/`

---

## 📚 Uso educacional

Este projeto é ideal para:

* Ensino de Física (lançamento oblíquo)
* Interpretação de dados experimentais
* Simulação computacional

---

## 👨‍💻 Créditos

Desenvolvido por **George B. Silva** para os alunos da disciplina de Mecânica
do curso de Licenciatura em Física da UFMT (Campus do Araguaia),
com o auxílio de **ChatGPT (OpenAI)**.

---

## 📄 Licença

Uso livre para fins educacionais.






