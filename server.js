import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { cars } from './data/cars.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

//Configurating the .env file
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL, 
    methods: ['GET', 'PUT', 'POST']
  }
});

app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carsList = cars;

// GET /cars - Fetch all cars
app.get('/cars', (req, res) => {
  res.status(200).json(carsList);
});

// PUT /cars/:id - Increment votes for a specific car
app.put('/cars/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const car = carsList.find((car) => car.id === id);

  if (!car) {
    return res.status(404).json({ message: `Car with id ${id} not found` });
  }

  // Increment votes
  car.votes++;

  try {
    // Save the updated cars list back to the file
    const carsFilePath = path.join(__dirname, 'data/cars.js');
    const fileContent = `export const cars = ${JSON.stringify(carsList, null, 2)};`;
    await fs.writeFile(carsFilePath, fileContent);

    // Notify connected clients about the vote update
    io.emit('updateCars', carsList);


    res.status(200).json({ car });
  } catch (err) {
    console.error('Error writing to cars.js:', err);
    res.status(500).json({ message: 'Failed to update database' });
  }
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
