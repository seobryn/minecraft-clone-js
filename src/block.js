import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()

function loadTexture (path) {
  const texture = textureLoader.load(path)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  return texture
}

const textures = {
  dirt: loadTexture('/minecraft-clone-js/textures/dirt.png'),
  grass: loadTexture('/minecraft-clone-js/textures/grass.png'),
  grassSide: loadTexture('/minecraft-clone-js/textures/grass_side.png'),
  stone: loadTexture('/minecraft-clone-js/textures/stone.png'),
  coalOre: loadTexture('/minecraft-clone-js/textures/coal_ore.png'),
  ironOre: loadTexture('/minecraft-clone-js/textures/iron_ore.png')
}

export const blocks = {
  empty: {
    id: 0,
    name: 'empty'
  },
  grass: {
    id: 1,
    name: 'grass',
    color: 0x559020,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.grass }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassSide }) // back
    ]
  },
  dirt: {
    id: 2,
    name: 'dirt',
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt })
  },
  stone: {
    id: 3,
    name: 'stone',
    color: 0x808080,
    scale: {
      x: 30,
      y: 30,
      z: 30
    },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone })
  },
  coalOre: {
    id: 4,
    name: 'coal',
    color: 0x000000,
    scale: {
      x: 30,
      y: 30,
      z: 30
    },
    scarcity: 0.8,
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre })
  },
  ironOre: {
    id: 5,
    name: 'iron',
    color: '#cbcdcd',
    scale: {
      x: 30,
      y: 30,
      z: 30
    },
    scarcity: 0.9,
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre })
  },
  cave: {
    id: 6,
    name: 'cave',
    scale: {
      x: 20,
      y: 20,
      z: 20
    },
    scarcity: 0.6,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt, opacity: 0 })
  }
}

export const resourcesBlocks = [
  blocks.stone,
  blocks.coalOre,
  blocks.ironOre,
  blocks.cave
]
