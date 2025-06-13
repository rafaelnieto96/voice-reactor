console.log("🎨 AI Background script loaded!");

let neurons = [];
let NUM_NEURONS = 40;
let ACTIVATION_DISTANCE = 150;
let MAX_CONNECTIONS = 5;

function calculateDensity() {
    console.log("📊 Calculating density...");
    const screenArea = window.innerWidth * window.innerHeight;
    const baseDensity = 0.00004;
    NUM_NEURONS = Math.max(10, Math.floor(screenArea * baseDensity));
    ACTIVATION_DISTANCE = Math.min(150, Math.max(80, window.innerWidth / 10));
    MAX_CONNECTIONS = window.innerWidth < 768 ? 3 : 5;
    console.log(`🧠 Created ${NUM_NEURONS} neurons`);
}

function setup() {
    let canvas = createCanvas(window.innerWidth, window.innerHeight);
    
    let container = document.getElementById('audio-waves-background');
    
    canvas.parent('audio-waves-background');
    
    angleMode(DEGREES);
    calculateDensity();

    for (let i = 0; i < NUM_NEURONS; i++) {
        neurons.push(new Neuron());
    }
}

function draw() {

    
    clear();
    
    // Dibujar neuronas
    neurons.forEach((neuron, index) => {
        neuron.update();
        neuron.show();
        
        
    });

    drawNeuralConnections();

    if (window.innerWidth > 768) {
        globalPulseEffect();
    }
}

class Neuron {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.connections = [];
        this.pulse = 0;
        const baseSize = window.innerWidth < 768 ? 15 : 25; // MÁS GRANDE
        this.targetSize = random(baseSize, baseSize * 1.6);
        // COLORES MÁS VISIBLES
        this.hue = 0; // ROJO PURO
        this.saturation = 100; // SATURACIÓN MÁXIMA
        this.brightness = 100; // BRILLO MÁXIMO
    }

    update() {
        const moveSpeed = window.innerWidth < 768 ? 0.15 : 0.25;
        this.pos.add(createVector(random(-moveSpeed, moveSpeed), random(-moveSpeed, moveSpeed)));
        this.pos.x = constrain(this.pos.x, 0, width);
        this.pos.y = constrain(this.pos.y, 0, height);

        let mouseDist = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        if (mouseDist < ACTIVATION_DISTANCE * 0.8) {
            this.activate();
        }

        this.pulse = lerp(this.pulse, 0, 0.08);
    }

    activate() {
        this.pulse = 1;
        this.hue = (this.hue + random(-5, 5)) % 360;
    }

    show() {
    // USAR RGB SIMPLE Y COLORES MUY VISIBLES
    fill(255, 0, 0, 255); // ROJO SÓLIDO
    noStroke();
    ellipse(this.pos.x, this.pos.y, 50); // CÍRCULO GRANDE ROJO
    
    // Círculo adicional más pequeño para estar seguro
    fill(0, 255, 0, 255); // VERDE SÓLIDO
    ellipse(this.pos.x + 10, this.pos.y + 10, 20);
}
}

function drawNeuralConnections() {
    colorMode(HSB, 360, 100, 100, 1);
    neurons.forEach((a, i) => {
        let others = neurons.slice(i + 1)
            .map(b => ({ neuron: b, dist: dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y) }))
            .sort((x, y) => x.dist - y.dist)
            .slice(0, MAX_CONNECTIONS);

        others.forEach(({ neuron: b, dist }) => {
            if (dist < ACTIVATION_DISTANCE * 1.5) {
                let alpha = map(dist, 0, ACTIVATION_DISTANCE * 1.5, 0.4, 0); // Menos opaco
                let lineWidth = map(dist, 0, ACTIVATION_DISTANCE * 1.5, 1.5, 0.3);
                
                let pulse = (a.pulse + b.pulse) * 0.5;
                alpha *= (0.3 + pulse * 0.3); // Menos intenso
                
                stroke(a.hue, a.saturation * 0.7, a.brightness * 0.9, alpha);
                strokeWeight(lineWidth);
                line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
            }
        });
    });
    colorMode(RGB);
}

function globalPulseEffect() {
    // Efecto más sutil
    noFill();
    stroke(45, 80, 90, 15); // Dorado muy sutil
    strokeWeight(1);
    let pulseSize = (frameCount % 150) * 2;
    ellipse(mouseX, mouseY, pulseSize, pulseSize);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    calculateDensity();
    neurons = [];
    for (let i = 0; i < NUM_NEURONS; i++) {
        neurons.push(new Neuron());
    }
}