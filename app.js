'use strict';


// VIDEO

/* CANVAS PREP */

const mainCanvas = document.getElementById("c");

//function resize() {
//    mainCanvas.width = document.body.clientWidth;
//    mainCanvas.height = document.body.clientHeight;
//}
//window.addEventListener('resize', resize, false); 
//resize();


/* VIDEO */

function startVideo() {
  Marching.init(mainCanvas);
  Marching.export(window);

  let bSize = Vec3(1,1,0.25)

  let r = Rotation(
    Box(bSize),
    Vec3(0,1,0))

  let r2 = Rotation(
    Box(bSize, Vec3(0.5, 0.5, 0)),
    Vec3(0,1,0))

  let r3 = Rotation(
    Box(bSize, Vec3(-0.5, -0.5, 0)),
    Vec3(0,1,0))

  let r4 = Rotation(
    Box(bSize, Vec3(-1, -1, 0)),
    Vec3(0,1,0))


  march(Union(Union(r, r2), 
              Union(r3, r4))).render( 3, true )

  const TWO_PI = 2 * Math.PI;
  const THREE_PI = 3 * Math.PI;
  const FOUR_PI = 4 * Math.PI;

  const angleAdj = function(rot, initPhase) {
    return function(time) {
      let t = (time + initPhase)  % FOUR_PI; 
      if(t > THREE_PI) {
        rot.angle = TWO_PI;
      } else if (t > TWO_PI) {
        rot.angle = (t - Math.PI);
      } else if (t > Math.PI) {
        rot.angle = Math.PI;
      } else {
        rot.angle = t;
      }
    }
  }

  callbacks.push( angleAdj(r2, 0))
  callbacks.push( angleAdj(r, Math.PI / 2))
  callbacks.push( angleAdj(r3, Math.PI))
  callbacks.push( angleAdj(r4, Math.PI * 1.5))
}


// AUDIO AND PROGRAM SETUP

CsoundObj.importScripts("./csound/").then(() => {
  fetch("untitled_no2.orc").then((response) => {
    response.text().then((orc) => {

      let startButton = document.getElementById("startButton");
      console.log(startButton);

      startButton.innerText = "Press to Start";
      startButton.disabled = false;
      startButton.onclick = function() {
        startVideo();

        let cs = new CsoundObj();
        cs.setOption("-m0")
        cs.compileOrc(orc);
        cs.start();

        document.getElementById("overlay").style= "display:none";
      }


    })
  })
});

