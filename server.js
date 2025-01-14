import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { cars } from "./cars.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app); // Create an HTTP server
const io = new Server(httpServer, { cors: { origin: "*" } }); // Attach Socket.IO to the HTTP server

app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const carsList = cars;

let maximalVotes = 0;

function initializeMaximalVotes() {
    carsList.forEach((car) => {
        if (car.votes > maximalVotes) {
            maximalVotes = car.votes;
        }
    });
}

initializeMaximalVotes();

// GET all cars
app.get("/cars", (req, res) => {
    res.json(carsList);
});

// GET maximal votes
app.get("/cars/maxVotes", (req, res) => {
    res.json(maximalVotes);
});

// PUT: Update votes for a car
app.put("/cars/:id", async (req, res) => {
    const id = req.params.id;
    const car = carsList.find((car) => car.id == id);

    // Check if the car exists
    if (!car) {
        return res.status(404).send(`Car with id ${id} not found`);
    }

    // Increment the car votes
    car.votes++;

    // Update maximal votes
    if (car.votes > maximalVotes) {
        maximalVotes = car.votes;
    }

    try {
        // Save the updated cars array back to the file
        const carsFilePath = path.join(__dirname, "cars.js");
        const fileContent = `export const cars = ${JSON.stringify(cars, null, 2)};`;
        await fs.writeFile(carsFilePath, fileContent);

        // Notify all clients of the updated data
        io.emit("updateCars", { cars: carsList, maximalVotes });

        // Send the response
        res.status(200).json({ message: "Car updated successfully", car, maximalVotes });
    } catch (err) {
        console.error("Error writing to cars.js:", err);

        // Handle file write errors
        res.status(500).json({ message: "Failed to update database" });
    }
});

// Start the server
httpServer.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
