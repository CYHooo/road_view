import TWEEN from '@tweenjs/tween.js';

const Animations = {
  // 相机移动实现漫游等动画
  animateCamera: (camera, controls, newP, newT, time = 2000, callBack) => {
    controls.enabled = true;
    const tween = new TWEEN.Tween({
      x1: camera.position.x,
      y1: camera.position.y,
      z1: camera.position.z,
      x2: controls.target.x,
      y2: controls.target.y,
      z2: controls.target.z,
    })
      .to(
        {
          x1: newP.x,
          y1: newP.y,
          z1: newP.z,
          x2: newT.x,
          y2: newT.y,
          z2: newT.z,
        },
        time,
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(function (object) {
        camera.position.set(object.x1, object.y1, object.z1);
        controls.target.set(object.x2, object.y2, object.z2);
        controls.update();
      })
      .onComplete(function () {
        controls.enabled = true;
        callBack();
      })
      .start();
  },
};

export default Animations;
