importModule("data/Schlaftraum.js")
importModule("data/PlayerData.js")
importModule("data/WorldData.js")
importModule("util/Array.js")
importModule("util/Math.js")
importModule("util/Helper.js")

let lockInput = false

function interact(id){
  let found;
  let viable = Schlaftraum
  // filters
  .filter(events => events.trigger == id)
  .filter(events => isSubset(PlayerData.flags, events.requirements.p_flags))
  .filter(events => !isOverlap(PlayerData.flags, events.requirements.n_flags))
  .filter(events => skipZero(events.requirements.day, day => WorldData.day > day))
  .filter(events => skipZero(events.requirements.weather, weather => WorldData.weather == weather))
  .filter(events => skipZero(events.requirements.time, time => WorldData.time == time))

  for (let index = 0; index <= 10; index++) {
    let yume = viable.filter(event => event.requirements.priority == index)
    if (yume.length > 0) {
      viable = yume
      break;
    }
  }
  
  if (viable.length == 0) {
    return
  } else if (viable.length > 1) {
    let total = viable.length
    found = viable[getRandomInt(total)]
  } else {
    found = viable[0]
  }

  displayEvent(found) 
}

function selectChoice(dir) {
  document.getElementById(`d-choice${PlayerData.choice}`).classList.remove("d-choice-active")
  if (dir == "up") {
    if (PlayerData.choice >= WorldData.choiceLimit - 1) {
      PlayerData.choice = 0
    } else {
      PlayerData.choice += 1
    }
  } else {
    if (PlayerData.choice <= 0) {
      PlayerData.choice = WorldData.choiceLimit - 1
    } else {
      PlayerData.choice -= 1
    }
  }
  document.getElementById(`d-choice${PlayerData.choice}`).classList.add("d-choice-active")
}

function acceptChoice(){
  console.log(WorldData)
  console.log(PlayerData)
  const activeEvent = Schlaftraum[WorldData.activeEvent]
  const nextEvent = activeEvent.choice[PlayerData.choice].next
  if (nextEvent == -1) {
    cleanup(activeEvent)
  }else{
    runEventById(Schlaftraum[nextEvent - 1],activeEvent)
  }
}

function runEventById(next,current){
  let firstImage = getAttributeArray(current.images, "id")
  console.log(next)
  let secondImage = getAttributeArray(next.images, "id")
  getOutsider(secondImage, firstImage).forEach( element => {
    document.getElementById(element).remove()
  })

  displayEvent(next)
}

function cleanup(event){
  for (let index = 0; index < event.images.length; index++) {
    const element = event.images[index];
    document.getElementById(element.id).remove()
  }
  for (let index = 0; index < event.animation.length; index++) {
    const element = event.animation[index];
    let animated = document.getElementById(element.id)
    if (element.type == SPRITE.reusable) {
      animated.style.transition = "none"
      animated.style.top = -1000
      animated.style.left = -1000
    }
    else animated.remove()
  }
  const box = document.getElementById("d-box")
  box.style.opacity = 0
  lockInput = false
}

function tileToGlobal(tile) {
  const offsetX = document.getElementById('gameCanvas').getBoundingClientRect().left
  const offsetY = document.getElementById('gameCanvas').getBoundingClientRect().top
  const global = [0,0]

  global[0] = tile[0] * TILE_SIZE + offsetX
  global[1] = tile[1] * TILE_SIZE + offsetY
  return global
}

function displayEvent(event) {
  PlayerData.choice = 0
  WorldData.activeEvent = Schlaftraum.indexOf(event)

  const container = document.getElementById("d-container")
  const box = document.getElementById("d-box")
  const dialogue = document.getElementById("d-text")
  const choiceBox = document.getElementById("d-choice-container")

  choiceBox.innerHTML = ''
  WorldData.choiceLimit = event.choice.length

  for (let index = 0; index < event.animation.length; index++) {
    const element = event.animation[index];
    let existence = document.getElementById(element.id)
    let position = tileToGlobal(element.pos)

    if (existence == null) {
  
      let entity = document.createElement("div")
      entity.id = element.id
      entity.style.transition = `all ${element.time}ms ${element.transition}`

      entity.style.width = TILE_SIZE + "px"
      entity.style.height = TILE_SIZE + "px"
      // entity.style.backgroundColor = "black"
      entity.style.position = "absolute"
      entity.style.top = position[0]
      entity.style.left = position[1]

      // element.sprites.forEach (e => {
      //   let lel = document.createElement("img")
      //   lel.
      //   entity.appendChild()
      // })
      for (let index = 0; index < element.sprites.length; index++) {
        const sprite = element.sprites[index];

        let spr = document.createElement("img")
        spr.src = sprite.sprite
        spr.id = sprite.id
        spr.style.width = `${TILE_SIZE}px`
        spr.style.height = `${TILE_SIZE}px`
        spr.style.objectFit = "fit"
        spr.style.transform = sprite.transform
        spr.style.opacity = sprite.active ? 1 : 0


        entity.appendChild(spr)
      }
      
      document.body.appendChild(entity)
    } else {
      existence.style.transition = `all ${element.time}ms ease`
      existence.style.top = position[0]
      existence.style.left = position[1]

      for (let index = 0; index < element.sprites.length; index++) {
        const sprite = element.sprites[index];

        let spr = document.getElementById(sprite.id)
        spr.src = sprite.sprite
        spr.style.width = `${TILE_SIZE}px`
        spr.style.height = `${TILE_SIZE}px`
        spr.style.objectFit = "fit"
        spr.style.transform = sprite.transform
        spr.style.opacity = sprite.active ? 1 : 0

      }
      
    }


  }


  if (WorldData.choiceLimit > 0) {
    if (WorldData.choiceLimit == 1 && event.choice[0].dialogue == "") {
      
    }
    else {
      let index = 0
      event.choice.forEach(element => {
        let choice = document.createElement("div")
        choice.classList.add("d-choice")
        choice.id = `d-choice${index}`
        choice.innerText = element.dialogue
        choiceBox.appendChild(choice)
        index++
      });
      document.getElementById("d-choice0").classList.add("d-choice-active")
    }
  }

  for (let index = 0; index < event.images.length; index++) {
    const element = event.images[index];

    let existence = document.getElementById(element.id)
    if(existence == null) {
      console.log(element)
      let sprite = document.createElement("img")
      sprite.style.opacity = 0
      if (!element.focus) {
        sprite.style.filter = "brightness(50%)"
      }else {
        sprite.style.filter = "brightness(100%)"
      }
      sprite.style.transition = "all 500ms ease"
      sprite.src = element.sprite
      sprite.style.height = "auto"
      sprite.style.width = "30vw"
      sprite.id = element.id
      sprite.style.top = element.position[1]/1149 * window.innerHeight
      sprite.style.left = element.position[0]/2124 * window.innerWidth
      sprite.style.position = "absolute"
      container.appendChild(sprite)
      sprite.style.opacity = 1
  
      console.log(element.id)
    } else {
      if (!element.focus) {
        existence.style.filter = "brightness(50%)"
      }else {
        existence.style.filter = "brightness(100%)"
      }
      existence.style.top = element.position[1]/1149 * window.innerHeight
      existence.style.left = element.position[0]/2124 * window.innerWidth
    }
  }

  container.style.top = window.scrollY
  container.style.left = window.scrollX
  dialogue.innerText = `[${event.speaker}] ${event.dialogue}`
  box.style.opacity = 1

  lockInput = true
}

