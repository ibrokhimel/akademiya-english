-- Rain Particle System
-- A scalable rain effect with configurable angle, intensity, and velocity

local MAX_PARTICLES = 50000
local SPAWN_BAND_HEIGHT = 300
local SPAWN_BAND_EXTENSION = 200 -- Extend spawn area beyond viewport edges
local VIEWPORT_WIDTH = 600
local VIEWPORT_HEIGHT = 300
local FADE_DURATION = 0.30

-- Color palette (cool blues/grays)
local COLORS = {
  0xFF8899AA, -- Light gray-blue
  0xFF7788AA, -- Medium gray-blue
  0xFF6677AA, -- Deeper blue
  0xFF5566AA, -- Rich blue
  0xFF4455AA, -- Deep blue
}

type Raindrop = {
  x: number,
  y: number,
  vx: number,
  vy: number,
  length: number,
  thickness: number,
  opacity: number,
  targetOpacity: number,
  color: number,
  age: number,
  maxAge: number,
  fading: boolean,
  artboardInstance: Artboard<nil>?,
}

type RainSystem = {
  precipitateAngle: Input<number>,
  precipitateIntensity: Input<number>,
  precipitateVelocity: Input<number>,
  precipitateParticle: Input<Artboard<nil>>,
  particles: { Raindrop },
  spawnAccumulator: number,
  context: Context?,
  hasParticleArtboard: boolean,
}

-- Utility: Convert degrees to radians
local function toRadians(degrees: number): number
  return degrees * math.pi / 180
end

-- Utility: Clamp value between min and max
local function clamp(value: number, min: number, max: number): number
  if value < min then
    return min
  end
  if value > max then
    return max
  end
  return value
end

-- Utility: Linear interpolation
local function lerp(a: number, b: number, t: number): number
  return a + (b - a) * t
end

-- Utility: Simple pseudo-random using math.random
local function randomRange(min: number, max: number): number
  return min + math.random() * (max - min)
end

-- Calculate spawn rate based on intensity (particles per second)
local function getSpawnRate(intensity: number): number
  -- Exponential scaling: drizzle (1-2) = 20-50, medium (3-5) = 100-300, storm (6-10) = 500-1500
  local normalized = clamp(intensity, 1, 10)
  return 10 * math.pow(1.8, normalized)
end

-- Calculate base velocity from angle and velocity multiplier
local function getBaseVelocity(
  angleDeg: number,
  velocityMult: number
): (number, number)
  local angleRad = toRadians(angleDeg)
  -- Rain falls down (positive Y), with horizontal component from angle
  -- Angle of 0 = straight down, positive = tilted right, negative = tilted left
  local baseSpeed = 200 + velocityMult * 150
  local vx = math.sin(angleRad) * baseSpeed
  local vy = math.cos(angleRad) * baseSpeed
  return vx, vy
end

-- Calculate gravity vector aligned to rain angle
local function getGravity(
  angleDeg: number,
  velocityMult: number
): (number, number)
  local angleRad = toRadians(angleDeg)
  local gravityStrength = 400 + velocityMult * 200
  local gx = math.sin(angleRad) * gravityStrength * 0.3
  local gy = math.cos(angleRad) * gravityStrength
  return gx, gy
end

-- Calculate drag coefficient based on intensity (turbulence)
local function getDragCoefficient(intensity: number): number
  -- Low intensity = minimal drag, high intensity = more turbulence/drag
  local normalized = clamp(intensity, 1, 10)
  return 0.01 + (normalized / 10) * 0.08
end

-- Get wind influence at higher intensities
local function getWindInfluence(intensity: number): number
  local normalized = clamp(intensity, 1, 10)
  if normalized < 5 then
    return 0
  end
  -- Wind emerges at intensity > 5, increases with intensity
  return (normalized - 5) * 20
end

-- Spawn a new raindrop
local function spawnRaindrop(self: RainSystem): Raindrop
  local intensity = clamp(self.precipitateIntensity, 1, 10)
  local velocity = clamp(self.precipitateVelocity, 0.5, 3)
  local angle = self.precipitateAngle

  -- Calculate spawn position along extended horizontal band
  -- Offset spawn position based on angle to ensure drops enter viewport
  local angleRad = toRadians(angle)
  local horizontalOffset = math.sin(angleRad) * SPAWN_BAND_HEIGHT * 2
  local spawnX = randomRange(
    -SPAWN_BAND_EXTENSION - horizontalOffset,
    VIEWPORT_WIDTH + SPAWN_BAND_EXTENSION - horizontalOffset
  )
  local spawnY = randomRange(-SPAWN_BAND_HEIGHT, 0)

  -- Base velocity with variance
  local baseVx, baseVy = getBaseVelocity(angle, velocity)

  -- Variance increases with intensity
  local varianceFactor = 1 + (intensity / 10) * 0.5
  local vxVariance = randomRange(-15, 15) * varianceFactor
  local vyVariance = randomRange(-10, 20) * varianceFactor
  local vx = baseVx + vxVariance
  local vy = baseVy + vyVariance

  -- Calculate speed for length calculation
  local speed = math.sqrt(vx * vx + vy * vy)

  -- Length proportional to velocity
  local baseLength = 8 + velocity * 12
  local lengthVariance = randomRange(0.7, 1.3)
  local dropLength = baseLength * lengthVariance * (speed / 300)

  -- Thickness scales with intensity
  local baseThickness = 1 + (intensity / 10) * 1.5
  local thicknessVariance = randomRange(0.8, 1.2)
  local thickness = baseThickness * thicknessVariance

  -- Opacity scales with intensity for heaviness
  local baseOpacity = 0.4 + (intensity / 10) * 0.4
  local opacityVariance = randomRange(0.85, 1.0)
  local targetOpacity = clamp(baseOpacity * opacityVariance, 0.3, 0.9)

  -- Select color from palette
  local colorIndex = math.floor(randomRange(1, #COLORS + 0.99))
  local color = COLORS[colorIndex]

  -- Max age based on expected travel time
  local maxAge = 3 + randomRange(0, 1)

  -- Create artboard instance if particle artboard is provided
  local artboardInstance: Artboard<nil>? = nil
  if self.hasParticleArtboard then
    artboardInstance = self.precipitateParticle:instance()
  end

  return {
    x = spawnX,
    y = spawnY,
    vx = vx,
    vy = vy,
    length = dropLength,
    thickness = thickness,
    opacity = 0, -- Start at 0 for fade-in
    targetOpacity = targetOpacity,
    color = color,
    age = 0,
    maxAge = maxAge,
    fading = false,
    artboardInstance = artboardInstance,
  }
end

-- Check if raindrop is off-screen
local function isOffScreen(drop: Raindrop): boolean
  local margin = 100
  return drop.y > VIEWPORT_HEIGHT + margin
    or drop.x < -margin - SPAWN_BAND_EXTENSION
    or drop.x > VIEWPORT_WIDTH + margin + SPAWN_BAND_EXTENSION
    or drop.y < -margin - SPAWN_BAND_HEIGHT
end

-- Update a single raindrop
local function updateRaindrop(
  drop: Raindrop,
  dt: number,
  intensity: number,
  velocity: number,
  angle: number
): boolean
  drop.age = drop.age + dt

  -- Check expiration
  if drop.age > drop.maxAge then
    return false
  end

  -- Check if off-screen
  if isOffScreen(drop) then
    return false
  end

  -- Get physics parameters
  local gx, gy = getGravity(angle, velocity)
  local drag = getDragCoefficient(intensity)
  local wind = getWindInfluence(intensity)

  -- Apply wind (oscillating for natural feel)
  local windEffect = wind * math.sin(drop.age * 3 + drop.x * 0.01)

  -- Apply gravity
  drop.vx = drop.vx + (gx + windEffect) * dt
  drop.vy = drop.vy + gy * dt

  -- Apply drag
  local speed = math.sqrt(drop.vx * drop.vx + drop.vy * drop.vy)
  if speed > 0 then
    local dragForce = drag * speed * speed
    local dragX = (drop.vx / speed) * dragForce * dt
    local dragY = (drop.vy / speed) * dragForce * dt
    -- Don't let drag reverse direction
    if math.abs(dragX) < math.abs(drop.vx) then
      drop.vx = drop.vx - dragX
    end
    if math.abs(dragY) < math.abs(drop.vy) then
      drop.vy = drop.vy - dragY
    end
  end

  -- Update position
  drop.x = drop.x + drop.vx * dt
  drop.y = drop.y + drop.vy * dt

  -- Update length based on current velocity (motion blur effect)
  local currentSpeed = math.sqrt(drop.vx * drop.vx + drop.vy * drop.vy)
  local baseLength = 8 + velocity * 12
  drop.length = baseLength * (currentSpeed / 300) * randomRange(0.95, 1.05)

  -- Handle fade-in/fade-out
  local fadeOutStart = drop.maxAge - FADE_DURATION
  if drop.age < FADE_DURATION then
    -- Fade in
    drop.opacity = lerp(0, drop.targetOpacity, drop.age / FADE_DURATION)
  elseif drop.age > fadeOutStart then
    -- Fade out
    drop.fading = true
    local fadeProgress = (drop.age - fadeOutStart) / FADE_DURATION
    drop.opacity = lerp(drop.targetOpacity, 0, fadeProgress)
  else
    drop.opacity = drop.targetOpacity
  end

  -- Advance artboard instance if present
  if drop.artboardInstance then
    drop.artboardInstance:advance(dt)
  end

  return true
end

-- Safely check if artboard is valid
local function isArtboardValid(artboard: Artboard<nil>): boolean
  local success = pcall(function()
    local _ = artboard.width
  end)
  return success
end

-- Initialize the rain system
local function init(self: RainSystem, context: Context): boolean
  self.context = context
  self.particles = {}
  self.spawnAccumulator = 0
  self.hasParticleArtboard = isArtboardValid(self.precipitateParticle)
  return true
end

-- Advance the simulation
local function advance(self: RainSystem, dt: number): boolean
  local intensity = clamp(self.precipitateIntensity, 1, 10)
  local velocity = clamp(self.precipitateVelocity, 0.5, 3)
  local angle = self.precipitateAngle

  -- Cap dt to prevent spiral of death
  local cappedDt = math.min(dt, 0.05)

  -- Update existing particles
  local aliveParticles: { Raindrop } = {}
  for _, drop in ipairs(self.particles) do
    if updateRaindrop(drop, cappedDt, intensity, velocity, angle) then
      table.insert(aliveParticles, drop)
    end
  end
  self.particles = aliveParticles

  -- Spawn new particles
  local spawnRate = getSpawnRate(intensity)
  self.spawnAccumulator = self.spawnAccumulator + spawnRate * cappedDt
  local particlesToSpawn = math.floor(self.spawnAccumulator)
  self.spawnAccumulator = self.spawnAccumulator - particlesToSpawn

  -- Limit spawning to maintain performance
  local availableSlots = MAX_PARTICLES - #self.particles
  particlesToSpawn = math.min(particlesToSpawn, availableSlots, 50) -- Cap per-frame spawns

  for _ = 1, particlesToSpawn do
    table.insert(self.particles, spawnRaindrop(self))
  end

  -- Always return true to keep system running
  return true
end

-- Draw the rain
local function draw(self: RainSystem, renderer: Renderer)
  for _, drop in ipairs(self.particles) do
    if drop.opacity > 0.01 then
      -- Calculate drop direction from velocity
      local speed = math.sqrt(drop.vx * drop.vx + drop.vy * drop.vy)
      if speed > 0.01 then
        local dirX = drop.vx / speed
        local dirY = drop.vy / speed

        -- If we have an artboard instance, draw it
        if drop.artboardInstance then
          renderer:save()

          -- Calculate rotation angle from velocity direction
          local rotation = math.atan2(dirX, dirY)

          -- Build transform: translate to position, then rotate
          local transform = Mat2D.withTranslation(drop.x, drop.y)
          transform = transform * Mat2D.withRotation(rotation)

          -- Optional: scale based on thickness/length for variety
          local scale = drop.thickness / 2
          transform = transform * Mat2D.withScale(scale, scale)

          renderer:transform(transform)
          drop.artboardInstance:draw(renderer)
          renderer:restore()
        else
          -- Fallback to path-based drawing
          local path = Path.new()

          -- Calculate tail position (opposite to direction of motion)
          local tailX = drop.x - dirX * drop.length
          local tailY = drop.y - dirY * drop.length

          -- Calculate perpendicular for thickness
          local perpX = -dirY * drop.thickness * 0.5
          local perpY = dirX * drop.thickness * 0.5

          -- Draw elongated shape (stretched rectangle/line)
          if drop.thickness > 1.5 then
            -- Thicker drops: draw as stretched rectangle
            path:moveTo(Vector.xy(tailX - perpX, tailY - perpY))
            path:lineTo(Vector.xy(tailX + perpX, tailY + perpY))
            path:lineTo(Vector.xy(drop.x + perpX * 0.3, drop.y + perpY * 0.3))
            path:lineTo(Vector.xy(drop.x - perpX * 0.3, drop.y - perpY * 0.3))
            path:close()
          else
            -- Thin drops: draw as tapered line
            path:moveTo(Vector.xy(tailX, tailY))
            path:lineTo(Vector.xy(drop.x, drop.y))
          end

          -- Calculate alpha from opacity
          local alpha = math.floor(drop.opacity * 255)
          alpha = clamp(alpha, 0, 255)

          -- Apply alpha to color
          local baseColor = drop.color
          local r = bit32.band(bit32.rshift(baseColor, 16), 0xFF)
          local g = bit32.band(bit32.rshift(baseColor, 8), 0xFF)
          local b = bit32.band(baseColor, 0xFF)
          local finalColor = bit32.bor(
            bit32.lshift(alpha, 24),
            bit32.lshift(r, 16),
            bit32.lshift(g, 8),
            b
          )

          -- Create paint and draw
          if drop.thickness > 1.5 then
            local fillPaint = Paint.with({
              style = 'fill',
              color = finalColor,
            })
            renderer:drawPath(path, fillPaint)
          else
            local strokePaint = Paint.with({
              style = 'stroke',
              thickness = math.max(0.5, drop.thickness),
              color = finalColor,
              cap = 'round',
            })
            renderer:drawPath(path, strokePaint)
          end
        end
      end
    end
  end
end

-- Export the Node factory
return function(): Node<RainSystem>
  return {
    -- Inputs with sensible defaults
    precipitateAngle = 0, -- Degrees: 0 = straight down, positive = tilted right
    precipitateIntensity = 5, -- 1-10: 1-2 drizzle, 3-5 medium, 6-10 storm
    precipitateVelocity = 1, -- 0.5-3: speed multiplier
    precipitateParticle = late(), -- Artboard to use as rain particle (assign in editor)

    -- Internal state
    particles = {},
    spawnAccumulator = 0,
    context = nil,
    hasParticleArtboard = false,

    -- Callbacks
    init = init,
    advance = advance,
    draw = draw,
  }
end

