window.onload = function () {
  try {
    init();
  } catch (e) {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) loadingOverlay.remove();
    alert(
      "Rất tiếc, đã có lỗi khi khởi tạo. Vui lòng thử lại trang.\nLỗi: " +
        e.message
    );
  }
};

function init() {
  // --- LẤY CÁC THÀNH PHẦN HTML ---
  const container3D = document.getElementById("container-3d");
  const loadingOverlay = document.getElementById("loading-overlay");
  const envelopeIcon = document.getElementById("envelope-icon");
  const musicPlayer = document.getElementById("music-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playIcon = playPauseBtn.querySelector(".icon-play");
  const pauseIcon = playPauseBtn.querySelector(".icon-pause");
  const backgroundMusic = document.getElementById("background-music");
  const letterView = document.getElementById("letter-view");
  const letterContainer = document.querySelector(".letter-container");
  const letterPagesContainer = document.getElementById("letter-pages");
  const pageIndicator = document.querySelector(".page-indicator");
  const imageModal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");

  // --- BIẾN TOÀN CỤC ---
  const photoUrls = Array.from(
    { length: 5 },
    (_, i) => `assets/images/photo${i + 1}.jpg`
  );
  let scene, camera, renderer, mainGroup, composer, clock, heart;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let photoMeshes = [];
  let isDragging = false;
  let rotationVelocity = { x: 0, y: 0 };

  // --- CÁC HÀM KHỞI TẠO 3D ---
  function setupScene() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container3D.appendChild(renderer.domElement);

    mainGroup = new THREE.Group();
    scene.add(mainGroup);

    addLights();
    createHeart();
    createPhotos3D();
    setupPostProcessing();
  }

  function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
  }

  function createHeart() {
    const shape = new THREE.Shape();
    const x = -0.9,
      y = -1.3;
    shape.moveTo(x + 0.5, y + 0.5);
    shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
    shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
    const extrudeSettings = {
      depth: 0.6,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xdd2e44,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 1.5,
      ior: 1.5,
      emissive: 0xff0055,
      emissiveIntensity: 0.4,
    });
    heart = new THREE.Mesh(geometry, material);
    heart.rotation.x = Math.PI;
    mainGroup.add(heart);
    anime({
      targets: heart.scale,
      x: 1.05,
      y: 1.05,
      z: 1.05,
      duration: 900,
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
    });
  }

  function setupPostProcessing() {
    const renderPass = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.21;
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.55;
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  }

  function createPhotos3D() {
    const textureLoader = new THREE.TextureLoader();
    const photoGeometry = new THREE.PlaneGeometry(0.8, 1.05);

    photoUrls.forEach((url, i) => {
      textureLoader.load(
        url,
        (texture) => {
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
          });
          const photoMesh = new THREE.Mesh(photoGeometry, material);
          photoMesh.userData = { isPhoto: true, url: url };
          photoMesh.scale.set(0, 0, 0);
          photoMesh.userData.orbit = {
            angle: (i / photoUrls.length) * Math.PI * 2,
            radius: 2.6,
            speed: (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
          };
          mainGroup.add(photoMesh);
          photoMeshes.push(photoMesh);
          if (photoMeshes.length === photoUrls.length) {
            animateSceneIn();
          }
        },
        undefined,
        (err) => {
          console.error("Lỗi khi tải ảnh: ", url, err);
        }
      );
    });
  }

  function animateSceneIn() {
    anime({
      targets: mainGroup.scale,
      x: 1,
      y: 1,
      z: 1,
      duration: 1200,
      easing: "spring(1, 80, 10, 0)",
    });
    anime({
      targets: photoMeshes.map((p) => p.material),
      opacity: 1,
      delay: anime.stagger(150, { start: 300 }),
      easing: "easeOutQuad",
    });
    anime({
      targets: photoMeshes.map((p) => p.scale),
      x: 1,
      y: 1,
      z: 1,
      delay: anime.stagger(150, { start: 300 }),
      easing: "spring(1, 80, 10, 0)",
    });
    envelopeIcon.classList.add("visible");
    musicPlayer.classList.add("visible");
  }

  function updateScene() {
    const elapsedTime = clock.getElapsedTime();
    photoMeshes.forEach((photo) => {
      photo.userData.orbit.angle += photo.userData.orbit.speed * 0.001;
      photo.position.x =
        Math.cos(photo.userData.orbit.angle) * photo.userData.orbit.radius;
      photo.position.z =
        Math.sin(photo.userData.orbit.angle) * photo.userData.orbit.radius;
      photo.position.y =
        Math.sin(elapsedTime * 1.5 + photo.userData.orbit.angle) * 0.2;
      photo.lookAt(camera.position);
    });
    if (!isDragging) {
      rotationVelocity.x *= 0.95;
      rotationVelocity.y *= 0.95;
    }
    mainGroup.rotation.y += rotationVelocity.y;
    mainGroup.rotation.x += rotationVelocity.x;
    mainGroup.rotation.x = Math.max(-0.4, Math.min(0.4, mainGroup.rotation.x));
  }

  function setupUIAndInteractions() {
    setupLetterInteraction();
    setupImageModalInteraction();
    setupMainSceneInteraction();
    setupMusicPlayer();
  }

  function setupLetterInteraction() {
    let pages = [];
    let currentPageIndex = 0;
    let dragStartX = 0;
    let isLetterDragging = false;

    fetch("context.txt")
      .then((r) => r.text())
      .then((text) => {
        const pageContents = text.split("---PAGE_BREAK---");
        letterPagesContainer.innerHTML = "";
        pageIndicator.innerHTML = "";
        pages = [];

        pageContents.forEach((content, i) => {
          const page = document.createElement("div");
          page.className = "letter-page";
          page.innerHTML = content.trim().replace(/\n/g, "<br>");
          letterPagesContainer.appendChild(page);
          pages.push(page);
          const dot = document.createElement("div");
          dot.className = "dot";
          dot.onclick = (e) => {
            e.stopPropagation();
            goToPage(i);
          };
          pageIndicator.appendChild(dot);
        });
        goToPage(0, false);
      });

    function goToPage(index, animate = true) {
      if (index < 0 || index >= pages.length) return;
      currentPageIndex = index;
      pages.forEach((page, i) => {
        const offset = i - currentPageIndex;
        anime({
          targets: page,
          translateX: `${offset * 100}%`,
          duration: animate ? 500 : 0,
          easing: "easeOutCubic",
        });
      });
      Array.from(pageIndicator.children).forEach((dot, i) => {
        dot.classList.toggle("active", i === currentPageIndex);
      });
    }

    letterContainer.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      isLetterDragging = true;
      dragStartX = e.clientX;
    });
    letterContainer.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      if (!isLetterDragging) return;
      isLetterDragging = false;
      const deltaX = e.clientX - dragStartX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
          goToPage(currentPageIndex + 1);
        } else {
          goToPage(currentPageIndex - 1);
        }
      }
    });

    envelopeIcon.addEventListener("click", () => {
      letterView.classList.add("visible");
      anime({
        targets: letterView,
        opacity: 1,
        duration: 400,
        easing: "easeOutQuad",
      });
      anime({
        targets: ".letter-container",
        scale: [0.7, 1],
        opacity: [0, 1],
        duration: 500,
        easing: "spring(1, 80, 12, 0)",
      });
    });

    letterView.addEventListener("click", (e) => {
      if (e.target === letterView) {
        anime({
          targets: letterView,
          opacity: 0,
          duration: 400,
          easing: "easeInQuad",
          complete: () => letterView.classList.remove("visible"),
        });
      }
    });
  }

  function setupImageModalInteraction() {
    let isModalOpen = false;
    let currentPhotoUrl = "";

    function openImageModal(url) {
      if (isModalOpen && url === currentPhotoUrl) return;
      const modalContent = document.querySelector(".modal-content");
      const loadNewImage = () => {
        modalImage.src = url;
        anime({
          targets: modalContent,
          opacity: [0, 1],
          scale: [0.9, 1],
          duration: 300,
          easing: "easeOutQuad",
        });
      };
      if (isModalOpen) {
        anime({
          targets: modalContent,
          opacity: 0,
          scale: 0.9,
          duration: 200,
          easing: "easeInQuad",
          complete: loadNewImage,
        });
      } else {
        isModalOpen = true;
        imageModal.classList.add("visible");
        anime({ targets: imageModal, opacity: 1, duration: 300 });
        loadNewImage();
      }
      currentPhotoUrl = url;
    }

    function closeImageModal() {
      if (!isModalOpen) return;
      anime({
        targets: imageModal,
        opacity: 0,
        duration: 300,
        easing: "easeOutCubic",
        complete: () => {
          imageModal.classList.remove("visible");
          isModalOpen = false;
          currentPhotoUrl = "";
        },
      });
    }
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        closeImageModal();
      }
    });
    window.openImageModal = openImageModal;
  }

  function setupMainSceneInteraction() {
    let previousPointerPosition = { x: 0, y: 0 };
    let dragStartX, dragStartY;

    container3D.addEventListener("click", (e) => {
      if (
        isDragging &&
        (Math.abs(e.clientX - dragStartX) > 10 ||
          Math.abs(e.clientY - dragStartY) > 10)
      ) {
        return;
      }
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(photoMeshes);
      if (intersects.length > 0) {
        window.openImageModal(intersects[0].object.userData.url);
      }
    });

    container3D.addEventListener("pointerdown", (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
    });
    container3D.addEventListener("pointermove", (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousPointerPosition.x;
        const deltaY = e.clientY - previousPointerPosition.y;
        rotationVelocity.y = deltaX * 0.002;
        rotationVelocity.x = deltaY * 0.002;
        previousPointerPosition = { x: e.clientX, y: e.clientY };
      }
    });
    container3D.addEventListener("pointerup", () => {
      isDragging = false;
    });
  }

  function setupMusicPlayer() {
    let isPlaying = false;
    const startAudio = () => {
      if (backgroundMusic.paused) {
        backgroundMusic
          .play()
          .then(() => {
            isPlaying = true;
            playIcon.style.display = "none";
            pauseIcon.style.display = "block";
          })
          .catch(() => {});
      }
      document.body.removeEventListener("click", startAudio, { once: true });
    };
    document.body.addEventListener("click", startAudio, { once: true });
    playPauseBtn.addEventListener("click", () => {
      isPlaying ? backgroundMusic.pause() : backgroundMusic.play();
      isPlaying = !isPlaying;
      playIcon.style.display = isPlaying ? "none" : "block";
      pauseIcon.style.display = isPlaying ? "block" : "none";
    });
  }

  const animate = () => {
    requestAnimationFrame(animate);
    updateScene();
    composer.render();
  };

  // Hiệu ứng các hạt trái tim rơi xuống
  (function heartsRainEffect() {
    const canvas = document.getElementById("hearts-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth,
      H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    window.addEventListener("resize", () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    });

    // Hàm vẽ trái tim nhỏ
    function drawHeart(x, y, size, color, rotate = 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotate);
      ctx.scale(size, size);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(0, -0.3, -0.5, -0.6, -0.5, -1);
      ctx.bezierCurveTo(-0.5, -1.4, -0.1, -1.6, 0, -1.2);
      ctx.bezierCurveTo(0.1, -1.6, 0.5, -1.4, 0.5, -1);
      ctx.bezierCurveTo(0.5, -0.6, 0, -0.3, 0, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function randomColor() {
      // Các màu hồng/đỏ ngọt ngào
      const colors = [
        "#ff69b4",
        "#ff4f81",
        "#ff77a9",
        "#fb3640",
        "#f06292",
        "#ffb6c1",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    // Tạo các hạt trái tim
    const hearts = [];
    const maxHearts = 40;

    function spawnHeart() {
      const size = Math.random() * 0.9 + 0.6;
      hearts.push({
        x: Math.random() * W,
        y: -24,
        vy: Math.random() * 1.1 + 1.3,
        vx: (Math.random() - 0.5) * 0.4,
        size: size * 16,
        color: randomColor(),
        rotate: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.03,
        alpha: Math.random() * 0.4 + 0.6,
      });
    }

    function animateHearts() {
      ctx.clearRect(0, 0, W, H);
      // Thêm hạt nếu chưa đủ
      if (hearts.length < maxHearts && Math.random() < 0.5) spawnHeart();

      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        h.x += h.vx;
        h.y += h.vy;
        h.rotate += h.vr;
        drawHeart(h.x, h.y, h.size / 16, h.color, h.rotate);

        if (h.y > H + 40) {
          hearts.splice(i, 1);
          i--;
        }
      }
      requestAnimationFrame(animateHearts);
    }
    animateHearts();
  })();

  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (composer) composer.setSize(width, height);
  }

  // --- KHỞI CHẠY ---
  setupScene();
  setupUIAndInteractions();
  onWindowResize();
  window.addEventListener("resize", onWindowResize);
  animate();

  loadingOverlay.style.opacity = "0";
  loadingOverlay.addEventListener("transitionend", () => {
    loadingOverlay.style.display = "none";
  });
}
