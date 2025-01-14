import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {cars} from './cars.js';
import fs from "fs/promises"; // Use promises-based fs module
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carsList = cars;

let maximalVotes = 0;

function initializeMaximalVotes(){
    carsList.forEach(car => {
        if (car.votes > maximalVotes) {
            maximalVotes = car.votes;
        }
    });
}

initializeMaximalVotes();

app.get('/cars', (req, res) => {
  res.json(carsList);
});

app.get('/cars/maxVotes', (req, res) => {
    res.json(maximalVotes);
});

app.put('/cars/:id', async (req, res) => {
    const id = req.params.id;
    const car = carsList.find((car) => car.id == id);
    if (!car) {
        res.status(404).send(`Car with id ${id} not found`);
        return;
    }
    car.votes++; //Incrementing the votes by one

    if (car.votes > maximalVotes) {
        maximalVotes = car.votes;
    }

    try {
        // Save the updated cars array back to the file
        const carsFilePath = path.join(__dirname, "cars.js");
        const fileContent = `export const cars = ${JSON.stringify(cars, null, 2)};`;
        await fs.writeFile(carsFilePath, fileContent);
    
        res.status(200).json({ message: "Car updated successfully", car, maximalVotes });
      } catch (err) {
        console.error("Error writing to cars.js:", err);
        res.status(500).json({ message: "Failed to update database" });
      }
    
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});