const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const E_display = document.getElementById("created-E")
let E = 0

// U[235] + n → U[236] → Ba[144] + Kr[89] + 3n + 200MeV

const PI2 = Math.PI * 2
const C_width = canvas.width
const C_height = canvas.height

const LimitSpeed = 200
const LimitEffectRadius = 400
const IncrementAlpha = 1 / LimitEffectRadius

function print(t) {
    console.log(t)
}

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    add(vector2) {
        this.x += vector2.x
        this.y += vector2.y
    }
    mul(m) {
        this.x *= m
        this.y *= m
    }
}

class Particle {
    constructor(r, x, y, v_x = 0, v_y = 0, color = "black", mass = 1) {
        this.r = r
        this.pos = new Vector(x, y)
        this.vel = new Vector(v_x, v_y)
        this.color = color
        this.mass = mass
        this.overlaped = false
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.r, 0, PI2)

        ctx.fill()
        ctx.closePath()
    }
    reachWall(value, max) {
        //x
        if (this.pos.x < 0) {
            this.vel.x *= -1
            this.pos.x = 0
        }
        else if (this.pos.x > C_width) {
            this.vel.x *= -1
            this.pos.x = C_width
        }

        //y
        if (this.pos.y < 0) {
            this.vel.y *= -1
            this.pos.y = 0
        }
        else if (this.pos.y > C_height) {
            this.vel.y *= -1
            this.pos.y = C_height
        }
    }
    convergeLimit() {
        if (this.vel.x > LimitSpeed) {
            this.vel.x = LimitSpeed
        }
        if (this.vel.y > LimitSpeed) {
            this.vel.y = LimitSpeed
        }
    }
    move() {
        this.pos.add(this.vel)
        this.reachWall()
        this.convergeLimit()
    }
    isOverlap(B) {
        const distance = (this.x - B.x) ** 2 + (this.y - B.y) ** 2
        if (distance <= (this.r + B.r) ** 2) {
            this.overlaped = true
            return true
        }
        this.overlaped = false
    }
    processOverlap(B) {
        this.pos.x += 1
        this.pos.y += 1
    }
    processCrash(B) {
        if (this.isOverlap(B)) {
            if (this.overlaped) {
                this.processOverlap()
            }
            let _vel = this.vel
            this.vel = B.vel
            B.vel = _vel
            return true
        }
    }
    get x() {
        return this.pos.x
    }
    get y() {
        return this.pos.y
    }
}

class Uranium235 extends Particle {
    constructor(x, y, v_x, v_y) {
        super(20, x, y, v_x, v_y, "#2ec52b", 235)
    }
}

class Uranium236 extends Particle {
    constructor(x, y, v_x, v_y) {
        super(20, x, y, v_x, v_y, "#ff5b0c", 237)
        this.life = 100
    }
    move() {
        super.move()
        this.life--
        if (this.life < 0) {
            destroyFromRenderList(this)
            Nuclear2(this)
        }
    }
}

class Krypton extends Particle {
    constructor(x, y, v_x, v_y) {
        super(8, x, y, v_x, v_y, "#4EA7BD", 89)
    }
    move() {
        super.move()
    }
}

class Barium extends Particle {
    constructor(x, y, v_x, v_y) {
        super(12, x, y, v_x, v_y, "#5F6E7F", 144)
    }
    move() {
        super.move()
    }
}

class Neutron extends Particle {
    constructor(x, y, v_x, v_y) {
        super(4, x, y, v_x, v_y, "orange")
    }
}

class Color {
    constructor(r, g, b, a) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }
    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`
    }
}

class Effect {
    constructor(x, y, color) {
        this.pos = new Vector(x, y)
        this.color = color
        this.r = 1
    }
    get x() {
        return this.pos.x
    }
    get y() {
        return this.pos.y
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = this.color.toString()
        ctx.arc(this.x, this.y, this.r, 0, PI2)

        ctx.fill()
        ctx.closePath()

        if (this.r < LimitEffectRadius) {
            this.r += 4
            this.color.a -= 0.02
        } else {
            Eff_destroyList.push(findIndex(Eff_renderList, this))
        }
    }
}

function sym(v) {
    if (v < 0) {
        return -1
    }
    return 1
}

function Nuclear1(U) {
    destroyFromRenderList(U)
    createRenderObject(new Uranium236(U.x, U.y, U.vel.x, U.vel.y))
}

function Nuclear2(U) {
    E += 30
    E_display.innerText = `E : ${E} MeV`
    Eff_createList.push(new Effect(U.x, U.y, new Color(255, 91, 27, 1)))
    createRenderObject(new Barium(U.x + 20, U.y, U.vel.x, -U.vel.y))
    createRenderObject(new Krypton(U.x, U.y + 40, - U.vel.x, U.vel.y))
    createRenderObject(new Neutron(U.x + 20, U.y + 40, U.vel.x, U.vel.y))
}

function Crash(A, B) {
    if (A instanceof Neutron && B instanceof Uranium235) {
        Nuclear1(B)
    }
    else if (A instanceof Uranium235 && B instanceof Neutron) {
        Nuclear1(A)
    }
}

function findIndex(arr, item) {
    for (i = 0; i < arr.length; i++) {
        if (arr[i] == item) {
            return i
        }
    }
    return -1
}

function destroyFromRenderList(item) {
    let index = findIndex(renderList, item)
    if (index == -1) {
        return false
    }
    destroyList.push(index)
}

function createRenderObject(item) {
    createList.push(item)
}

function renderObject() {
    for (var i = 0; i < renderList.length; i++) {
        renderList[i].draw()
        renderList[i].move()
        for (var j = i + 1; j < renderList.length; j++) {
            if (renderList[i].processCrash(renderList[j])) {
                Crash(renderList[i], renderList[j])
            }
        }
    }
    for (var i = destroyList.length - 1; i >= 0; i--) {
        renderList.splice(destroyList[i], 1)
    }
    for (var i = createList.length - 1; i >= 0; i--) {
        renderList.push(createList[i])
    }
    destroyList = []
    createList = []
}

function renderEffect() {
    for (var i = 0; i < Eff_renderList.length; i++) {
        Eff_renderList[i].draw()
    }
    for (var i = Eff_destroyList.length - 1; i >= 0; i--) {
        Eff_renderList.splice(Eff_destroyList[i], 1)
    }
    for (var i = Eff_createList.length - 1; i >= 0; i--) {
        Eff_renderList.push(Eff_createList[i])
    }
    Eff_destroyList = []
    Eff_createList = []
}

const renderList = [
    new Neutron(0, 0, 1, 1),
]
for (var i = 0; i < 5; i++) {
    for (var j = 0; j < 5; j++) {
        renderList.push(new Uranium235(100 * j, 100 * i, Math.random() * 4 - 2, Math.random() * 4 - 2))
    }
}

let destroyList = []
let createList = []

const Eff_renderList = []
let Eff_destroyList = []
let Eff_createList = []

function render() {
    ctx.clearRect(0, 0, C_width, C_height)
    /*ctx.beginPath()
    ctx.fillStyle = new Color(255,255,255,0.4)
    ctx.fillRect(0,0, C_width, C_height)
    ctx.closePath()*/

    renderObject()
    renderEffect()

    requestAnimationFrame(render)
}
render()