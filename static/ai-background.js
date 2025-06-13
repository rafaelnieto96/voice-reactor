let neurons = [];
let NUM_NEURONS = 40;
let ACTIVATION_DISTANCE = 150;
let MAX_CONNECTIONS = 5;

function calculateDensity() {
    const screenArea = window.innerWidth * window.innerHeight;
    const baseDensity = 0.00004;
    NUM_NEURONS = Math.max(10, Math.floor(screenArea * baseDensity));
    ACTIVATION_DISTANCE = Math.min(150, Math.max(80, window.innerWidth / 10));
    MAX_CONNECTIONS = window.innerWidth < 768 ? 3 : 5;
}

function setup() {
    let canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('audio-waves-background');
    clear(); 
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
        const baseSize = window.innerWidth < 768 ? 8 : 12;
        this.targetSize = random(baseSize, baseSize * 1.6);

        const colorSchemes = [
            { h: 45, s: 95, b: 95 },   // Dorado brillante
            { h: 30, s: 100, b: 100 }, // Naranja intenso
            { h: 60, s: 90, b: 90 },   // Amarillo-verde
            { h: 180, s: 85, b: 90 },  // Cian brillante
            { h: 200, s: 80, b: 95 },  // Azul claro
            { h: 320, s: 85, b: 95 },  // Magenta brillante
            { h: 15, s: 95, b: 90 }    // Rojo-naranja
        ];

        const scheme = random(colorSchemes);
        this.hue = scheme.h + random(-10, 10);
        this.saturation = scheme.s + random(-10, 10);
        this.brightness = scheme.b + random(-5, 5);
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
        colorMode(HSB, 360, 100, 100, 1);
        let currentSize = this.targetSize * (1 + this.pulse * 1.5);
        let currentAlpha = 0.6 + 0.4 * sin(frameCount * 0.5 + this.pos.x * 0.1);

        // Glow effect
        noStroke();
        fill(this.hue, this.saturation, this.brightness, this.pulse * 0.3 * currentAlpha);
        ellipse(this.pos.x, this.pos.y, currentSize * 1.5);

        // Main body
        stroke(this.hue, this.saturation * 0.8, this.brightness, 0.8 * currentAlpha);
        strokeWeight(1.5);
        fill(this.hue, this.saturation * 0.5, this.brightness * 0.8, 0.9 * currentAlpha);
        ellipse(this.pos.x, this.pos.y, this.targetSize);
        colorMode(RGB);
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
                let alpha = 0.4;
                let lineWidth = map(dist, 0, ACTIVATION_DISTANCE * 1.5, 1.5, 0.8); 

                let pulse = (a.pulse + b.pulse) * 0.5;
                alpha *= (0.7 + pulse * 0.3); 

                stroke(a.hue, a.saturation * 0.7, a.brightness * 0.9, alpha);
                strokeWeight(lineWidth);
                line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
            }
        });
    });
    colorMode(RGB);
}

function globalPulseEffect() {
    noFill();
    colorMode(HSB, 360, 100, 100, 1);
    stroke(45, 80, 90, window.innerWidth < 768 ? 6 : 8); 
    strokeWeight(0.5); 
    let pulseSize = (frameCount % 180) * (window.innerWidth < 768 ? 0.8 : 1.2);
    ellipse(mouseX, mouseY, pulseSize, pulseSize);
    colorMode(RGB);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    calculateDensity();
    neurons = [];
    for (let i = 0; i < NUM_NEURONS; i++) {
        neurons.push(new Neuron());
    }
}