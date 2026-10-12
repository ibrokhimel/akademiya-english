-- Confetti: burst of falling rectangles with gravity and rotation.
-- fireTrigger: when fired, burst spawns after delaySeconds.
-- color1–color4: colors used for confetti (exposed inputs).

local MAX_PARTICLES = 200
local BURST_COUNT = 60
local GRAVITY = 420
local BOUNDS_W = 400
local BOUNDS_H = 400
local MARGIN = 80

type ConfettiPiece = {
  x: number,
  y: number,
  vx: number,
  vy: number,
  rotation: number,
  rotationSpeed: number,
  width: number,
  height: number,
  colorIndex: number,
  opacity: number,
  life: number,
  maxLife: number,
}

export type Confetti = {
  fireTrigger: Input<Trigger>,
  delaySeconds: Input<number>,
  color1: Input<Color>,
  color2: Input<Color>,
  color3: Input<Color>,
  color4: Input<Color>,
  particles: { ConfettiPiece },
  colors: { Color },
  confettiCountdown: number,
}

local function randomRange(min: number, max: number): number
  return min + math.random() * (max - min)
end

local function clamp(value: number, minVal: number, maxVal: number): number
  if value < minVal then
    return minVal
  end
  if value > maxVal then
    return maxVal
  end
  return value
end

-- Build color table from inputs (call each frame or when inputs change so colors stay in sync)
local function updateColors(self: Confetti)
  self.colors = {}
  if self.color1 then
    table.insert(self.colors, self.color1)
  end
  if self.color2 then
    table.insert(self.colors, self.color2)
  end
  if self.color3 then
    table.insert(self.colors, self.color3)
  end
  if self.color4 then
    table.insert(self.colors, self.color4)
  end
  if #self.colors == 0 then
    table.insert(self.colors, Color.rgb(255, 100, 180))
    table.insert(self.colors, Color.rgb(255, 200, 80))
    table.insert(self.colors, Color.rgb(100, 200, 255))
    table.insert(self.colors, Color.rgb(150, 255, 150))
  end
end

local function spawnConfettiBurst(self: Confetti)
  local n = math.min(BURST_COUNT, MAX_PARTICLES - #self.particles)
  local cx = BOUNDS_W * 0.5
  local cy = BOUNDS_H * 0.35
  for _ = 1, n do
    local angle = randomRange(0, 2 * math.pi)
    local speed = randomRange(180, 420)
    local vx = math.cos(angle) * speed * randomRange(0.6, 1.2)
    local vy = -math.sin(angle) * speed * randomRange(0.4, 0.9) - 80
    local colorIndex = 1
    if #self.colors > 0 then
      colorIndex = math.floor(randomRange(1, #self.colors + 0.99))
    end
    local w = randomRange(4, 14)
    local h = randomRange(3, 8)
    table.insert(self.particles, {
      x = cx + randomRange(-20, 20),
      y = cy,
      vx = vx,
      vy = vy,
      rotation = randomRange(0, 2 * math.pi),
      rotationSpeed = randomRange(-4, 4),
      width = w,
      height = h,
      colorIndex = colorIndex,
      opacity = randomRange(0.85, 1),
      life = 0,
      maxLife = randomRange(2.5, 4.5),
    })
  end
end

-- When fireTrigger is fired: start countdown; burst spawns after delaySeconds.
local function onFireTrigger(self: Confetti)
  local delay = (self.delaySeconds ~= nil and self.delaySeconds >= 0) and self.delaySeconds or 0
  self.confettiCountdown = delay
end

local function updatePiece(p: ConfettiPiece, dt: number): boolean
  p.vy = p.vy + GRAVITY * dt
  p.x = p.x + p.vx * dt
  p.y = p.y + p.vy * dt
  p.rotation = p.rotation + p.rotationSpeed * dt
  p.life = p.life + dt
  if p.life > p.maxLife then
    return false
  end
  if p.y > BOUNDS_H + MARGIN then
    return false
  end
  if p.x < -MARGIN or p.x > BOUNDS_W + MARGIN then
    return false
  end
  return true
end

-- Draw a rotated rectangle (center at origin, then we translate)
local function drawRect(renderer: Renderer, w: number, h: number, color: Color)
  local hw = w * 0.5
  local hh = h * 0.5
  local path = Path.new()
  path:moveTo(Vector.xy(-hw, -hh))
  path:lineTo(Vector.xy(hw, -hh))
  path:lineTo(Vector.xy(hw, hh))
  path:lineTo(Vector.xy(-hw, hh))
  path:close()
  local paint = Paint.with({ style = 'fill', color = color })
  renderer:drawPath(path, paint)
end

function init(self: Confetti, context: Context): boolean
  self.particles = {}
  self.colors = {}
  self.confettiCountdown = 0
  updateColors(self)
  return true
end

function advance(self: Confetti, dt: number): boolean
  updateColors(self)
  if self.confettiCountdown > 0 then
    self.confettiCountdown = self.confettiCountdown - dt
    if self.confettiCountdown <= 0 then
      spawnConfettiBurst(self)
    end
  end
  local alive: { ConfettiPiece } = {}
  for _, p in ipairs(self.particles) do
    if updatePiece(p, dt) then
      table.insert(alive, p)
    end
  end
  self.particles = alive
  return true
end

function update(self: Confetti)
  updateColors(self)
end

function draw(self: Confetti, renderer: Renderer)
  for _, p in ipairs(self.particles) do
    if
      p.y > -MARGIN
      and p.y < BOUNDS_H + MARGIN
      and p.x > -MARGIN
      and p.x < BOUNDS_W + MARGIN
    then
      local c = self.colors[p.colorIndex] or self.colors[1]
      local alpha = clamp(1 - (p.life / p.maxLife) * 0.7, 0.2, 1)
      local r = Color.red(c)
      local g = Color.green(c)
      local b = Color.blue(c)
      local drawColor = Color.rgba(r, g, b, math.floor(alpha * 255))
      renderer:save()
      renderer:transform(Mat2D.withTranslation(p.x, p.y))
      renderer:transform(Mat2D.withRotation(p.rotation))
      drawRect(renderer, p.width, p.height, drawColor)
      renderer:restore()
    end
  end
end

return function(): Node<Confetti>
  return {
    fireTrigger = onFireTrigger,
    delaySeconds = 1,
    color1 = Color.rgb(255, 100, 180),
    color2 = Color.rgb(255, 200, 80),
    color3 = Color.rgb(100, 200, 255),
    color4 = Color.rgb(150, 255, 150),
    particles = {},
    colors = {},
    confettiCountdown = 0,
    init = init,
    advance = advance,
    update = update,
    draw = draw,
  }
end
