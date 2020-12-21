const $ = require('jquery');
const THREE = require('three');
const fighterJSON = require('./fighter.json');

const f = () => 2.0 * (Math.random() - 0.5) * 5.0;
const getTime = () => new Date().getTime() / 1000.0;

const main = function() {

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  const light = new THREE.PointLight(0xffffff, 1, 100);
  //const light = new THREE.DirectionalLight(0xffffff, 1);

  const geometry = new THREE.SphereGeometry(0.25, 32, 32);
  const planetMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
  const planet = new THREE.Mesh( geometry, planetMaterial );

  scene.add(planet);
  scene.add(light);

  camera.position.z = 5;
  light.position.z = 7;

  const loader = new THREE.ObjectLoader();
  // https://opengameart.org/content/3d-spaceships-pack
  console.log(fighterJSON);
  const fighterObject = loader.parse(fighterJSON);
  console.log(fighterObject);
  const fighterGeometry = fighterObject.geometry;
  const m = new THREE.Matrix4();
  m.makeRotationX(0.5 * Math.PI);
  fighterGeometry.applyMatrix4(m);
  //scene.add(fighterObject)

  const fighters = [];
  const fighterCount = 10000;
  const fighterMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
  const instancedFighter = new THREE.InstancedMesh(fighterGeometry, fighterMaterial, fighterCount);
  scene.add(instancedFighter);

  for (let i = 0; i < fighterCount; i++) {
    //const fighter = fighterObject.clone();
    //const fighter = new THREE.Mesh(fighterGeometry, fighterMaterial);
    const fighter = new THREE.Mesh(fighterGeometry, new THREE.MeshBasicMaterial( { color: 0xFF0000 } ));
    //scene.add(fighter);
    fighter.position.x = f();
    fighter.position.y = f();
    fighter.position.z = -10.0 - f();
    const scale = 0.05;
    fighter.scale.x = scale;
    fighter.scale.y = scale;
    fighter.scale.z = scale;
    fighters.push(fighter);

    //fighter.target = Math.floor(Math.random() * fighterCount);

    fighter.target = new THREE.Vector3();
    fighter.target.x = f();
    fighter.target.y = f();
    fighter.target.z = -10.0 - f();
    fighter.targetTime = getTime() - Math.random() * 10.0;
    fighter.rotationSpeed = 0.0;

    fighter.velocity = new THREE.Vector3();
    fighter.velocity.x = 0.0;
    fighter.velocity.y = 0.0;
    fighter.velocity.z = 0.0;
  }

  const fly = function(index, fighter) {
//    const target = fighters[fighter.target];
//    const tx = target.position.x;
//    const ty = target.position.y;
//    const tz = target.position.z;
    const tx = fighter.target.x;
    const ty = fighter.target.y;
    const tz = fighter.target.z;

    const dx = tx - fighter.position.x - 0 * fighter.velocity.x;
    const dy = ty - fighter.position.y - 0 * fighter.velocity.y;
    const dz = tz - fighter.position.z - 0 * fighter.velocity.z;
    const v = new THREE.Vector3(dx, dy, dz);
    const d = v.length();
    //if (d <= 1.0) {
    if (getTime() - fighter.targetTime >= 1.0) {
      //console.log("new target");
      fighter.target.x = 0.5 * (f() + fighter.position.x);
      fighter.target.y = 0.5 * (f() + fighter.position.y);
      fighter.target.z = 0.5 * (-10.0 - f() + fighter.position.z);
      fighter.targetTime = getTime() - Math.random();
    }
    v.normalize();

    //const forward = () => new THREE.Vector3(0, 1, 0);
    //const dirv = forward().applyQuaternion(fighter.quaternion);
    const dirv = new THREE.Vector3();
    fighter.getWorldDirection(dirv);
    dirv.normalize();
    //const rotationSpeed = 1.10 * dirv.dot(v);
    //const rotationSpeed = 1.10 * dirv.dot(v);
    const rotationSpeed = 0.05;
    //fighter.rotationSpeed += rotationSpeed;
    //fighter.rotationSpeed *= 0.95;
    //if (dirv.dot(v) != 1.0) {
    const q = new THREE.Quaternion().setFromUnitVectors(dirv, v);
    if (fighter.quaternion.angleTo(q) >= 0.0 * Math.PI / 180.0) {
      fighter.quaternion.rotateTowards(q, rotationSpeed);
    } else {
      fighter.quaternion.set(q.x, q.y, q.z, q.w);
    }
    fighter.updateMatrix();
    //} else {
    //  fighter.lookAt(fighter.position.clone().add(v));
    //}

    const thrust = 0.004;

    //const dirv2 = forward().applyQuaternion(fighter.quaternion);
    const dirv2 = new THREE.Vector3();
    fighter.getWorldDirection(dirv2);
    dirv2.normalize();
    const gravity = 0.0005;
    const gx = planet.position.x - fighter.position.x;
    const gy = planet.position.y - fighter.position.y;
    const gz = planet.position.z - fighter.position.z;
    const gvec = new THREE.Vector3(gx, gy, gz);
    gvec.normalize();
    const ax = dirv2.x * thrust + gvec.x * gravity;
    const ay = dirv2.y * thrust + gvec.y * gravity;
    const az = dirv2.z * thrust + gvec.z * gravity;

    fighter.velocity.x += ax;
    fighter.velocity.y += ay;
    fighter.velocity.z += az;
    const friction = 0.90;
    fighter.velocity.x *= friction;
    fighter.velocity.y *= friction;
    fighter.velocity.z *= friction;
    fighter.position.x += fighter.velocity.x;
    fighter.position.y += fighter.velocity.y;
    fighter.position.z += fighter.velocity.z;

    const l = 10.0;
    if (fighter.position.x <= -l) {
      fighter.position.x = -l;
    }
    if (fighter.position.x >= l) {
      fighter.position.x = l;
    }
    if (fighter.position.y <= -l) {
      fighter.position.y = -l;
    }
    if (fighter.position.y >= l) {
      fighter.position.y = l;
    }
    if (fighter.position.z <= -l) {
      fighter.position.z = -l;
    }
    if (fighter.position.z >= 0) {
      fighter.position.z = 0;
    }
    fighter.updateMatrix();
    //instancedFighter.setColorAt(index, new THREE.Color(Math.random(), Math.random(), Math.random(), 1.0));
    instancedFighter.setMatrixAt(index, fighter.matrix);

    //fighter.lookAt(fighter.position.clone().add(fighter.velocity
  };

  const animate = function () {
    requestAnimationFrame( animate );
    for (let i = 0; i < fighters.length; i++) {
      fly(i, fighters[i]);
    }
    instancedFighter.instanceMatrix.needsUpdate = true;
    renderer.render( scene, camera );
  };

  animate();

};

$(main);
