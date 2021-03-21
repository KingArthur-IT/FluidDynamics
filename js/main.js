//color in hsl
class Mouse{
    constructor() {
        this.mouseDownPos = { x: 0, y: 0 };
        this.mouseUpPos = { x: 0, y: 0 };
        this.isDown = false;
        this.color = 0;
    }
}
class Cell{
    constructor(color) {
        this.pos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.pressure = 0;
        this.color = color; //Color is hsl index
    }
    //Update velocity of the current cell
    updateVelocity(mouse, forceRadius, velocityStep) {
        let dx = this.pos.x - mouse.mouseUpPos.x;
        let dy = this.pos.y - mouse.mouseUpPos.y;
        let distance = Math.sqrt(dy * dy + dx * dx);
            
        if (distance < forceRadius) {
            let magnitude = 1 - distance / forceRadius;
            this.velocity.x += -velocityStep * magnitude * (mouse.mouseUpPos.x - mouse.mouseDownPos.x);
            this.velocity.y +=  velocityStep * magnitude * (mouse.mouseUpPos.y - mouse.mouseDownPos.y);
            
            this.color = mouse.color;
        }
    }
}
class Grid{
    constructor() {
        this.width  = 0;
        this.height = 0;
        this.cols_count = 0;
        this.rows_count = 0;
        this.cell_size = 5;
        this.cells = [];
    }
    Initialize(w, h, initColor) {
        this.cells.length = 0;
        this.width  = w;
        this.height = h;
        this.cols_count = (this.width / this.cell_size);
        this.rows_count = (this.height / this.cell_size);

        for (let i = 0; i < parseInt(this.cols_count); i++){
            this.cells[i] = [];
            for (let j = 0; j < parseInt(this.rows_count); j++){
                this.cells[i].push(new Cell(initColor));
                this.cells[i][j].pos.x = i * this.cell_size;
                this.cells[i][j].pos.y = j * this.cell_size;
            }
        }
    }
    calculatePressure(i, j) {
        let x = 0, y = 0;

        let colPrev = i - 1; let colNext = i + 1;
        let rowPrev = j - 1; let rowNext = j + 1;
        
        if (colPrev < 0)                    { colPrev = parseInt(this.cols_count) - 1; }
        if (colNext > parseInt(this.cols_count) - 1)  { colNext = 0; }
        if (rowPrev < 0)                    { rowPrev = parseInt(this.rows_count) - 1; }
        if (rowNext > parseInt(this.rows_count) - 1)  { rowNext = 0; }

        x =   this.cells[colPrev][rowNext].velocity.x * 0.5
            + this.cells[colPrev][j].velocity.x
            + this.cells[colPrev][rowPrev].velocity.x * 0.5
            - this.cells[colNext][rowNext].velocity.x * 0.5
            - this.cells[colNext][j].velocity.x
            - this.cells[colNext][rowPrev].velocity.x * 0.5;
        
        y =   this.cells[colPrev][rowNext].velocity.y * 0.5
            + this.cells[i][rowNext].velocity.y
            + this.cells[colPrev][rowNext].velocity.y * 0.5
            - this.cells[colPrev][rowPrev].velocity.y * 0.5
            - this.cells[i][rowPrev].velocity.y
            - this.cells[colNext][rowPrev].velocity.y * 0.5;
        return (x + y) * 0.25;
    } 
    recalculateVelocity(i, j) {
        let x = 0, y = 0;

        let colPrev = i - 1; let colNext = i + 1;
        let rowPrev = j - 1; let rowNext = j + 1;

        if (colPrev < 0) { colPrev = parseInt(this.cols_count) - 1; };
        if (colNext > parseInt(this.cols_count) - 1) {colNext = 0; };
        if (rowPrev < 0) { rowPrev = parseInt(this.rows_count) - 1; };
        if (rowNext > parseInt(this.rows_count) - 1) { rowNext = 0; };

        x =   this.cells[colPrev][rowNext].pressure * 0.5
            + this.cells[colPrev][j].pressure
            + this.cells[colPrev][rowPrev].pressure * 0.5
            - this.cells[colNext][rowNext].pressure * 0.5
            - this.cells[colNext][j].pressure
            - this.cells[colNext][rowPrev].pressure * 0.5;
        y =   this.cells[colPrev][rowNext].pressure * 0.5
            + this.cells[i][rowNext].pressure
            + this.cells[colNext][rowNext].pressure * 0.5
            - this.cells[colPrev][rowPrev].pressure * 0.5
            - this.cells[i][rowPrev].pressure
            - this.cells[colNext][rowPrev].pressure * 0.5;
        x *= 0.25; y *= 0.25;
        x += this.cells[i][j].velocity.x; y += this.cells[i][j].velocity.y;        
        x *= 0.985; y *= 0.985;
        return { x , y };
    }
    colorDiffusion() {
        for (let i = 1; i < parseInt(this.cols_count) - 1; i++){ 
            for (let j = 1; j < parseInt(this.rows_count) - 1; j++){
                let colorSum = this.cells[i][j].color
                    + this.cells[i - 1][j - 1].color
                    + this.cells[i - 1][j].color
                    + this.cells[i - 1][j + 1].color
                    + this.cells[i + 1][j - 1].color
                    + this.cells[i + 1][j].color
                    + this.cells[i + 1][j + 1].color
                    + this.cells[i][j - 1].color
                    + this.cells[i][j + 1].color;
                this.cells[i][j].color = colorSum /= 9;
            }
        }
    }
    gridUpdateProperties(mouse, forceRadius) {
        for (let i = 0; i < parseInt(this.cols_count); ++i) {
            for (let j = 0; j < parseInt(this.rows_count); ++j) {
                if (mouse.isDown) {
                    this.cells[i][j].updateVelocity(mouse, forceRadius, 1);
                }
                this.cells[i][j].pressure = this.calculatePressure(i, j);
                this.cells[i][j].velocity = this.recalculateVelocity(i, j);
            }
        }
        this.colorDiffusion();
    }
}
class Simulation{
    constructor(canvas, contex) {
        this.cnv = canvas;
        this.ctx = contex;
        this.cfg = {
            particleColor: 200,
            particlesCount: 17000,
            force_radius: 30
        }
    
        this.particles = [];
        this.color = [];
        this.particleSizes = [];
        this.mouse = new Mouse();        
        this.grid = new Grid();
        this.background = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
                            -1.0, 1.0, 1.0, 1.0, 1.0, -1.0];
        
        this.setAnimationProperties();      
        this.Animation();

        window.onresize = () => {
            this.setAnimationProperties();
        }
    }
    //Set canvas width and height, grid sizes and particles
    setAnimationProperties() {
        this.cnv.width  = innerWidth;
        this.cnv.height = innerHeight;
        if (this.cnv.width < 800) {
            this.cfg.force_radius = 20;
            this.cfg.particlesCount = 10000;
        };
        this.grid.Initialize(innerWidth, innerHeight, this.cfg.particleColor);
        this.InitializeParticles();
    }
    InitializeParticles() {
        this.particles.length = 0;
        this.color.length = 0;
        this.particleSizes.length = 0;

        let spaceStep = Math.sqrt(4 / this.cfg.particlesCount);
        let x = -1 + spaceStep / 2; let y = 1 - spaceStep / 2;
        for (let i = 0; i < this.cfg.particlesCount; i++) {
            x += spaceStep;
            if (x > 1) {
                x = -1 + spaceStep / 2;
                y -= spaceStep;
            }
            this.particles.push(x, y);
            this.color.push(0.0, 0.0, 0.0, 0.0);
            this.particleSizes.push(1.0);
        }
        this.shaderProgram = this.createShaders(this.ctx);
        this.createBuffer(this.ctx, this.shaderProgram, "coordinates", "pColor", "pSize");
    }
    //mod == 1 is for particles drawing, == 0 for clear with opacity
    createShaders(gl) {        
        let vertCode =`
        attribute vec2 coordinates;
        attribute vec4 pColor;
        attribute float pSize;
        uniform int mode;
        varying highp vec4 vColor;

        void main(void) {
            gl_Position = vec4(coordinates, 0.0, 1.0);
            gl_PointSize = pSize;
            if (mode == 1)
                vColor = vec4(pColor);
            else
                vColor = vec4(0.0, 0.0, 0.0, 0.12);
        }
        `;
        let fragCode = `
        varying highp vec4 vColor;
        
        void main(void) {
            gl_FragColor = vColor;
        }
        `;

        let vertShader = gl.createShader(gl.VERTEX_SHADER); //Create shader object
        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertShader, vertCode); //Attach vertex shader source code
        gl.shaderSource(fragShader, fragCode);

        gl.compileShader(vertShader); //Compile the vertex shader
        gl.compileShader(fragShader);

        let shaderProgram = gl.createProgram(); // Create a shader program object to store combined shader program
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        return shaderProgram;
    }
    //Draw all particles
    drawParticles(gl, width, height, count) {      
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.viewport(0, 0, width, height); 
        gl.drawArrays(gl.POINTS, 0, count); 
    }
    //Draw background with opacity to clear and create tails
    drawBackground(gl, width, height, count) {       
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.viewport(0, 0, width, height); 
        gl.drawArrays(gl.TRIANGLES, 0, count); 
    }
    createBuffer(gl, shaderProgram, attrName, attrName2, attrName3) {
        // Create a new buffer objects
        this.vertex_buffer = gl.createBuffer(); 
        this.color_buffer = gl.createBuffer();
        this.sizes_buffer = gl.createBuffer();

        //---------------------------------------------------------------------------------
        // Bind an empty array buffer to it  
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);  
        let coord = gl.getAttribLocation(shaderProgram, attrName); //Get the attribute location
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
        gl.enableVertexAttribArray(coord); //Enable the attribute
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        let colors = gl.getAttribLocation(shaderProgram, attrName2); //Get the attribute location
        gl.vertexAttribPointer(colors, 4, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
        gl.enableVertexAttribArray(colors); //Enable the attribute

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizes_buffer);
        let sizes = gl.getAttribLocation(shaderProgram, attrName3); //Get the attribute location
        gl.vertexAttribPointer(sizes, 1, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
        gl.enableVertexAttribArray(sizes); //Enable the attribute
    }
    //Update particles position, color and size
    updateParticlesProperties(particleStep) {
        for (let i = 0; i < this.cfg.particlesCount; i++){
            //position of particle
            let x = this.grid.cols_count * this.grid.cell_size * (this.particles[i * 2] + 1) / 2
            let y = this.grid.rows_count * this.grid.cell_size * (this.particles[i * 2 + 1] + 1) / 2
            
            //particle col and row on grid
            let col = parseInt(x / this.grid.cell_size);
            let row = parseInt(this.grid.rows_count) - parseInt(y / this.grid.cell_size);

            //loop the domain
            if (col > parseInt(this.grid.cols_count) - 1) {
                col = parseInt(this.grid.cols_count - 1);
            }
            if (row > parseInt(this.grid.rows_count) - 1) {
                row = parseInt(this.grid.rows_count) - 1;
            }

            //get the velocity of the cell in which particle is in
            let vel = this.grid.cells[col][row].velocity;
            let magnitude = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

            //change position of the particle
            x += vel.x * particleStep; y += vel.y * particleStep;
            //translate coordinates to webGl -1:1
            x = 2 * x / this.grid.width - 1;
            y = 2 * y / this.grid.height - 1;
            //loop the domain
            if (x > 1)   { x -= 2; }
            if (y > 1)   { y -= 2; }
            if (x < -1)   { x += 2 }
            if (y < -1) { y += 2; }
            
            //set the position
            this.particles[i * 2] = x;
            this.particles[i * 2 + 1] = y;

            //get the hsl index of the color
            let hslColor = this.grid.cells[col][row].color;
            let { R, G, B } = this.hslToRGB(hslColor, 1.0, 0.5);
            this.color[i * 4] = R;
            this.color[i * 4 + 1] = G;
            this.color[i * 4 + 2] = B;
            //opacity of the color
            this.color[i * 4 + 3] = 1.0;
            //particle size
            this.particleSizes[i] = 1.0;            
            if (magnitude > 0.05) {
                this.particleSizes[i] = 1.5;
            };
            if (magnitude > 0.2) {
                this.particleSizes[i] = 2.0;
            };

        }
    }
    //Animation loop
    Animation() {
        this.grid.gridUpdateProperties(this.mouse, this.cfg.force_radius);
        //update particles position, color and size
        let particleStep = 1.0;
        this.updateParticlesProperties(particleStep);
        
        //-- draw background to clear the domain with opacity --
        //set drawing mode to 0
        this.ctx.uniform1i(this.ctx.getUniformLocation(this.shaderProgram, 'mode'), 0);
        //send background coords to buffer
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.vertex_buffer);  
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(this.background), this.ctx.STATIC_DRAW);
        //send colors to buffer
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.color_buffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(this.color), this.ctx.STATIC_DRAW);

        this.drawBackground(this.ctx, this.grid.width, this.grid.height, 6);

        //-- draw particles --
        //set drawing mode to 1
        this.ctx.uniform1i(this.ctx.getUniformLocation(this.shaderProgram, 'mode'), 1);
        //send particles coords to buffer
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.vertex_buffer);  
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(this.particles), this.ctx.STATIC_DRAW);
        //send particles colors to buffer
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.color_buffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(this.color), this.ctx.STATIC_DRAW);
        //send particles sizes to buffer
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.sizes_buffer);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(this.particleSizes), this.ctx.STATIC_DRAW);

        this.drawParticles(this.ctx, this.grid.width, this.grid.height, this.cfg.particlesCount);
        
        window.requestAnimationFrame(() => this.Animation())
    }
    hslToRGB(H, S, L) {
        //according to formula fron wiki
        let Q, P, Hk, TR, TG, TB, R, G, B;
        
        if (L < 0.5) { Q = L * (S + 1.0); }
        else { Q = L + S - L * S };
        P = 2.0 * L - Q;
        Hk = H / 360;
        TR = Hk + 1 / 3;
        TG = Hk;
        TB = Hk - 1 / 3;

        if (TR < 0) { TR += 1.0 };
        if (TG < 0) { TG += 1.0 };
        if (TB < 0) { TB += 1.0 };

        if (TR > 1) { TR -= 1.0 };
        if (TG > 1) { TG -= 1.0 };
        if (TB > 1) { TB -= 1.0 };

        R = P;
        if (TR < 1 / 6)             { R = P + (Q - P) * 6.0 * TR; }
        if (1 / 6 <= TR < 1 / 2)    { R = Q; }
        if (1 / 2 <= TR < 2 / 3)    { R = P + (Q - P) * (2 / 3 - TR) * 6.0; }
        
        G = P;
        if (TG < 1 / 6)             { G = P + (Q - P) * 6.0 * TG; }
        if (1 / 6 <= TG < 1 / 2)    { G = Q; }
        if (1 / 2 <= TG < 2 / 3) { G = P + (Q - P) * (2 / 3 - TG) * 6.0; }
        
        B = P;
        if (TB < 1 / 6)             { B = P + (Q - P) * 6.0 * TB; }
        if (1 / 6 <= TB < 1 / 2)    { B = Q; }
        if (1 / 2 <= TB < 2 / 3) { B = P + (Q - P) * (2 / 3 - TB) * 6.0; }
        
        return { R, G, B };
    }
}
(function () {
    cnv = document.getElementById('canvas');
    ctx = cnv.getContext('webgl', { preserveDrawingBuffer: true});
    let simulation = new Simulation(cnv, ctx);

    window.addEventListener("mousedown", mouse_down_handler);
    window.addEventListener("touchstart", mouse_down_handler);

    window.addEventListener("mouseup", mouse_up_handler);
    window.addEventListener("touchend", mouse_up_handler);

    cnv.addEventListener("mousemove", mouse_move_handler);
    cnv.addEventListener("touchmove", touch_move_handler);

    function mouse_down_handler(e) {
        simulation.mouse.isDown = true;
        simulation.mouse.mouseDownPos.x = e.offsetX;
        simulation.mouse.mouseDownPos.y = e.offsetY;
        simulation.mouse.mouseUpPos.x = e.offsetX;
        simulation.mouse.mouseUpPos.y = e.offsetY;

        simulation.mouse.color = Math.random() * 360;
    }
    function mouse_up_handler() {
        simulation.mouse.isDown = false;
    }
    function mouse_move_handler(e) {
        if (simulation.mouse.isDown) {
            simulation.mouse.mouseUpPos.x = simulation.mouse.mouseDownPos.x;
            simulation.mouse.mouseUpPos.y = simulation.mouse.mouseDownPos.y;

            simulation.mouse.mouseDownPos.x = e.offsetX;
            simulation.mouse.mouseDownPos.y = e.offsetY;
        }
    }
    function touch_move_handler(e) {
        if (simulation.mouse.isDown) {
            simulation.mouse.mouseUpPos.x = simulation.mouse.mouseDownPos.x;
            simulation.mouse.mouseUpPos.y = simulation.mouse.mouseDownPos.y;

            //This line gets the coordinates for where the canvas is positioned on the screen.
            let rect = cnv.getBoundingClientRect();

            /*
            And this sets the mouse coordinates to where the first touch is. Since we're using pageX
            and pageY, we need to subtract the top and left offset of the canvas so the values are correct.
            */
            simulation.mouse.mouseDownPos.x = e.touches[0].pageX - rect.left;
            simulation.mouse.mouseDownPos.y = e.touches[0].pageY - rect.top;
        }
    }

}());