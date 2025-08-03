const displacementSlider = function (opts) {
  let vertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;
  let fragment = `
    varying vec2 vUv;
    uniform sampler2D currentImage;
    uniform sampler2D nextImage;
    uniform float dispFactor;
    void main() {
      vec2 uv = vUv;
      float intensity = 0.3;
      vec4 orig1 = texture2D(currentImage, uv);
      vec4 orig2 = texture2D(nextImage, uv);
      vec4 _currentImage = texture2D(currentImage, vec2(uv.x, uv.y + dispFactor * (orig2 * intensity)));
      vec4 _nextImage = texture2D(nextImage, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1 * intensity)));
      vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);
      gl_FragColor = finalTexture;
    }
  `;
  let images = opts.images, sliderImages = [];
  let canvasWidth = images[0].clientWidth;
  let canvasHeight = images[0].clientHeight;
  let parent = opts.parent;
  let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  let renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let renderW = Math.max(renderWidth, canvasWidth);
  let renderH = canvasHeight;

  let renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x23272a, 1.0);
  renderer.setSize(renderW, renderH);
  parent.appendChild(renderer.domElement);

  let loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  images.forEach((img) => {
    let image = loader.load(img.getAttribute("src") + "?v=" + Date.now());
    image.magFilter = image.minFilter = THREE.LinearFilter;
    image.anisotropy = renderer.capabilities.getMaxAnisotropy();
    sliderImages.push(image);
  });

  let scene = new THREE.Scene();
  scene.background = new THREE.Color(0x23272a);
  let camera = new THREE.OrthographicCamera(
    renderWidth / -2, renderWidth / 2, renderHeight / 2, renderHeight / -2, 1, 1000
  );
  camera.position.z = 1;

  let mat = new THREE.ShaderMaterial({
    uniforms: {
      dispFactor: { type: "f", value: 0.0 },
      currentImage: { type: "t", value: sliderImages[0] },
      nextImage: { type: "t", value: sliderImages[1] }
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    opacity: 1.0
  });

  let geometry = new THREE.PlaneBufferGeometry(parent.offsetWidth, parent.offsetHeight, 1);
  let object = new THREE.Mesh(geometry, mat);
  object.position.set(0, 0, 0);
  scene.add(object);

  // Pagination event listeners (already present)
  let pagButtons = Array.from(document.getElementById("pagination").querySelectorAll("button"));
  let isAnimating = false;
  pagButtons.forEach((el) => {
    el.addEventListener("click", function () {
      if (!isAnimating) {
        isAnimating = true;
        document.getElementById("pagination").querySelector(".active").classList.remove("active");
        this.classList.add("active");
        let slideId = parseInt(this.dataset.slide, 10);
        mat.uniforms.nextImage.value = sliderImages[slideId];
        mat.uniforms.nextImage.needsUpdate = true;
        gsap.to(mat.uniforms.dispFactor, {
          value: 1,
          duration: 1,
          ease: "expo.inOut",
          onComplete: function () {
            mat.uniforms.currentImage.value = sliderImages[slideId];
            mat.uniforms.currentImage.needsUpdate = true;
            mat.uniforms.dispFactor.value = 0.0;
            isAnimating = false;
          }
        });
        let slideTitleEl = document.getElementById("slide-title");
        let slideStatusEl = document.getElementById("slide-status");
        let nextSlideTitle = document.querySelector(`[data-slide-title="${slideId}"]`).innerHTML;
        let nextSlideStatus = document.querySelector(`[data-slide-status="${slideId}"]`).innerHTML;
        gsap.to(slideTitleEl, {
          autoAlpha: 0,
          y: 20,
          duration: 0.5,
          ease: "expo.in",
          onComplete: function () {
            slideTitleEl.innerHTML = nextSlideTitle;
            gsap.to(slideTitleEl, { autoAlpha: 1, y: 0, duration: 0.5 });
          }
        });
        gsap.to(slideStatusEl, {
          autoAlpha: 0,
          y: 20,
          duration: 0.5,
          ease: "expo.in",
          onComplete: function () {
            slideStatusEl.innerHTML = nextSlideStatus;
            gsap.to(slideStatusEl, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.1 });
          }
        });
      }
    });
  });

  let currentSlide = 0;
  setInterval(() => {
    if (!isAnimating) {
      currentSlide = (currentSlide + 1) % sliderImages.length;
      pagButtons[currentSlide].click();
    }
  }, 3000);

 window.addEventListener("resize", function () {
  const newWidth = parent.offsetWidth;
  const newHeight = parent.offsetHeight;
  renderer.setSize(newWidth, newHeight);
});

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
};

imagesLoaded(document.querySelectorAll("#slider img"), () => {
  document.body.classList.remove("loading");
  const el = document.getElementById("slider");
  const imgs = Array.from(el.querySelectorAll("img"));
  new displacementSlider({
    parent: el,
    images: imgs
  });
});

//card
document.querySelectorAll('.custom-carousel .item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.custom-carousel .item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});