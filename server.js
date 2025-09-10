//server.js

const express = require('express'); //express para criar o servidor
const cors = require('cors'); //cors para a comunicação
const fs = require('fs'); //file system para ler e escrever arquivos json
const path = require('path'); //path para lidar com caminhos de arquivos

const app = express();
const PORT = 3000;
const dbFolderPath = path.join(__dirname, 'database'); //leva para nossa pasta database
const usersFilePath = path.join(dbFolderPath, 'users.json'); //leva para o arquivo users.json
const playerDataFilePath = path.join(dbFolderPath, 'player_data.json'); //leva para o arquivo playerData.json

app.use(cors());
app.use(express.json());

const readData = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erro ao ler o arquivo ${filePath}:`, error);
        return [];
    }
};

const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Erro ao escrever no arquivo ${filePath}:`, error);
    }
};

//Rota de registro
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    //verifica se usuário ja existe
    const users = readData(usersFilePath);
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        return res.status(400).json({ success: false, message: 'Usuário já existe.' });
    }

    //adiciona novo usuário
    users.push({ username, password });
    writeData(usersFilePath, users);


    //cria dado inical do jogador
    const players = readData(playerDataFilePath);
    players.push({ username: username, score: 0, rank: 'Novato' });
    writeData(playerDataFilePath, players);

    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso.' })
});

//Rota de login

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const users = readData(usersFilePath);

    const foundUser = users.find(user => user.username === username && user.password === password);

    if (foundUser) {
        res.status(200).json({ success: true, message: 'Login realizado com sucesso.' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

//rota para atualizar rank
app.post('/save-score', (req, res) => {
    const { username, score } = req.body;

    if (!username || score === undefined) {
        return res.status(400).json({ success: false, message: 'Usuário e pontuação são obrigatórios.' });
    }
    const players = readData(playerDataFilePath);
    const playerIndex = players.findIndex(p => p.username === username);

    if (playerIndex !== -1) {
        if (score > players[playerIndex].score) {
            players[playerIndex].score = score;

            if (score > 1500) {
                players[playerIndex].rank = 'Mestre da Segurança';
            } else if (score > 1000) {
                players[playerIndex].rank = 'Experiente';
            } else if (score > 500) {
                players[playerIndex].rank = 'Aprendiz';
            } else {
                players[playerIndex].rank = 'Novato';
            }
        }
        writeData(playerDataFilePath, players);
        res.status(200).json({ success: true, message: "Pontuação salva com sucesso!" });
    } else {
        res.status(404).json({ success: false, message: "Jogador não encontrado." });
    }
});

//Rota para pegar o rank
app.get("/ranking", (req, res) => {
  const players = readData(playerDataFilePath);

  const sortedPlayers = players.sort((a, b) => b.score - a.score);

  res.status(200).json(sortedPlayers);
});

//iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
