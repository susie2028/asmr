function playPngSequence(elementId, folder, frameCount, frameDurationMs, autoStart = true) {
    const imageElement = document.getElementById(elementId);

    if (!imageElement) {
        return null;
    }

    const frames = Array.from(
        { length: frameCount },
        (_, index) => `${folder}/frame_${String(index + 1).padStart(2, "0")}.png`
    );

    frames.slice(1).forEach((src) => {
        const image = new Image();
        image.src = src;
    });

    let currentFrame = 0;
    let timer = null;

    function start() {
        if (timer !== null) {
            return;
        }

        currentFrame = 0;
        imageElement.src = frames[currentFrame];
        timer = window.setInterval(() => {
            currentFrame = (currentFrame + 1) % frameCount;
            imageElement.src = frames[currentFrame];
        }, frameDurationMs);
    }

    function stop() {
        if (timer === null) {
            return;
        }

        window.clearInterval(timer);
        timer = null;
    }

    function playOnce(oneShotFrameDurationMs = frameDurationMs, onComplete = null) {
        stop();
        currentFrame = 0;
        imageElement.src = frames[currentFrame];
        timer = window.setInterval(() => {
            currentFrame += 1;

            if (currentFrame >= frameCount) {
                window.clearInterval(timer);
                timer = null;
                if (onComplete) {
                    onComplete();
                } else {
                    start();
                }
                return;
            }

            imageElement.src = frames[currentFrame];
        }, oneShotFrameDurationMs);
    }

    if (autoStart) {
        start();
    }

    return { start, stop, playOnce };
}

const eyesLoop = playPngSequence("eyes", "assets/eyes_motion", 16, 180);
const eyesStare = playPngSequence("eyes", "assets/eyes_stare", 16, 70, false);
const dogImage = document.getElementById("dogBody");
const dogRestSrc = dogImage?.getAttribute("src");
const dogShake = playPngSequence("dogBody", "assets/tales_shake", 16, 65, false);
const bookSequence = playPngSequence("book", "assets/book_motion", 16, 250);
const bookAudio = document.getElementById("bookAudio");
const lpImage = document.getElementById("lp");
const lpTracks = [
    {
        motionFolder: "assets/lp1_motion",
        stopImage: "assets/lp1_stop.png",
        audio: "assets/chronopopofficial-lofi-sample-if-i-cant-have-you-330746.mp3",
    },
    {
        motionFolder: "assets/lp2_motion",
        stopImage: "assets/lp2_stop.png",
        audio: "assets/mostakim_sonchoy-instrumental-melody-489361.mp3",
    },
    {
        motionFolder: "assets/lp3_motion",
        stopImage: "assets/lp3_stop.png",
        audio: "assets/multimusicas-a-glass-of-wine-and-you-476236.mp3",
    },
];
lpTracks.forEach((track) => {
    track.sequence = playPngSequence("lp", track.motionFolder, 16, 70, false);
});
let currentLpIndex = 0;
const playButton = document.getElementById("playButton");
const lpAudio = document.getElementById("lpAudio");
const lpAudioSource = document.getElementById("lpAudioSource");
let isLpPlaying = false;
const musicPanelToggle = document.getElementById("musicPanelToggle");
const volumePanelToggle = document.getElementById("volumePanelToggle");
const musicPanel = document.getElementById("musicPanel");
const volumePanel = document.getElementById("volumePanel");

function playLpAudio() {
    if (isLpPlaying && lpAudio?.paused) {
        lpAudio.play().catch(() => {});
    }
}

function setLpAudio(track) {
    if (!lpAudio || !lpAudioSource || lpAudioSource.getAttribute("src") === track.audio) {
        return;
    }

    lpAudio.pause();
    lpAudioSource.src = track.audio;
    lpAudio.load();
}

function selectNextLp() {
    lpTracks[currentLpIndex].sequence.stop();
    lpAudio?.pause();

    currentLpIndex = (currentLpIndex + 1) % lpTracks.length;
    const track = lpTracks[currentLpIndex];
    setLpAudio(track);

    if (isLpPlaying) {
        track.sequence.start();
        playLpAudio();
    } else if (lpImage) {
        lpImage.src = track.stopImage;
    }

    syncLpControls();
}

function toggleLpPlayback() {
    if (!playButton) {
        return;
    }

    if (isLpPlaying) {
        lpTracks[currentLpIndex].sequence.stop();
        lpAudio?.pause();
        lpImage.src = lpTracks[currentLpIndex].stopImage;
    } else {
        lpTracks[currentLpIndex].sequence.start();
        playLpAudio();
    }

    isLpPlaying = !isLpPlaying;
    playButton.setAttribute("aria-pressed", String(isLpPlaying));
    syncLpControls();
}

function syncLpControls() {
    document.querySelectorAll("[data-track-play]").forEach((button) => {
        const trackIndex = Number(button.dataset.trackPlay);
        const isCurrentTrackPlaying = trackIndex === currentLpIndex && isLpPlaying;
        button.setAttribute("aria-pressed", String(isCurrentTrackPlaying));
        button.setAttribute("aria-label", isCurrentTrackPlaying ? "일시정지" : "재생");
        button.closest(".track-row")?.classList.toggle("is-current", trackIndex === currentLpIndex);
    });
}

function playTrackFromPanel(trackIndex) {
    if (trackIndex === currentLpIndex && isLpPlaying) {
        toggleLpPlayback();
        return;
    }

    lpTracks[currentLpIndex].sequence.stop();
    lpAudio?.pause();
    currentLpIndex = trackIndex;
    setLpAudio(lpTracks[currentLpIndex]);
    isLpPlaying = true;
    lpTracks[currentLpIndex].sequence.start();
    playLpAudio();
    playButton?.setAttribute("aria-pressed", "true");
    syncLpControls();
}

function closeControlPanels() {
    if (musicPanel) {
        musicPanel.hidden = true;
    }
    if (volumePanel) {
        volumePanel.hidden = true;
    }
    musicPanelToggle?.setAttribute("aria-expanded", "false");
    volumePanelToggle?.setAttribute("aria-expanded", "false");
}

function toggleControlPanel(panel, toggle) {
    const shouldOpen = panel?.hidden;
    closeControlPanels();

    if (shouldOpen && panel && toggle) {
        panel.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
    }
}

musicPanelToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleControlPanel(musicPanel, musicPanelToggle);
});

volumePanelToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleControlPanel(volumePanel, volumePanelToggle);
});

musicPanel?.addEventListener("click", (event) => event.stopPropagation());
volumePanel?.addEventListener("click", (event) => event.stopPropagation());

document.querySelectorAll("[data-track-play]").forEach((button) => {
    button.addEventListener("click", () => {
        playTrackFromPanel(Number(button.dataset.trackPlay));
    });
});

document.addEventListener("click", (event) => {
    if (event.target.closest(".control-popover, #musicPanelToggle, #volumePanelToggle")) {
        return;
    }

    closeControlPanels();
}, true);

const windowImage = document.getElementById("window");
const sunnyWindowSrc = windowImage?.getAttribute("src");
const rainAudio = document.getElementById("rainAudio");
const weatherToggle = document.getElementById("weatherToggle");
const weatherIcon = document.getElementById("weatherIcon");
const rainyWindowFrames = Array.from(
    { length: 16 },
    (_, index) => `assets/window_rainy/frame_${String(index + 1).padStart(2, "0")}.png`
);

rainyWindowFrames.forEach((src) => {
    const image = new Image();
    image.src = src;
});

let rainyWindowTimer = null;
let isWindowRainy = false;

function syncWeatherIcon() {
    if (!weatherIcon || !weatherToggle) {
        return;
    }

    weatherIcon.src = isWindowRainy ? "assets/sun_icon.png" : "assets/rain_icon.png";
    weatherToggle.setAttribute("aria-pressed", String(isWindowRainy));
    weatherToggle.setAttribute(
        "aria-label",
        isWindowRainy ? "맑은 날씨로 바꾸기" : "비 오는 날씨로 바꾸기"
    );
}

syncWeatherIcon();

function toggleWindowWeather() {
    if (!windowImage) {
        return;
    }

    isWindowRainy = !isWindowRainy;
    syncWeatherIcon();

    if (rainyWindowTimer !== null) {
        window.clearInterval(rainyWindowTimer);
        rainyWindowTimer = null;
    }

    if (!isWindowRainy) {
        windowImage.src = sunnyWindowSrc;
        if (rainAudio) {
            rainAudio.pause();
            rainAudio.currentTime = 0;
        }
        return;
    }

    if (rainAudio) {
        rainAudio.play().catch((error) => {
            console.warn("Rain audio playback failed:", error);
        });
    }

    let currentFrame = 0;
    windowImage.src = rainyWindowFrames[currentFrame];
    rainyWindowTimer = window.setInterval(() => {
        currentFrame = (currentFrame + 1) % rainyWindowFrames.length;
        windowImage.src = rainyWindowFrames[currentFrame];
    }, 100);
}

weatherToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleWindowWeather();
});

function buildFramePaths(folder, frameCount) {
    return Array.from(
        { length: frameCount },
        (_, index) => `${folder}/frame_${String(index + 1).padStart(2, "0")}.png`
    );
}

function preloadFrames(frames) {
    frames.forEach((src) => {
        const image = new Image();
        image.src = src;
    });
}

const coffeeEffectFrames = buildFramePaths("assets/coffee_effect", 16);
const cookiesMotionFrames = buildFramePaths("assets/cookies_motion", 16);
const cookiesImage = document.getElementById("cookies");
const cookiesRestSrc = cookiesImage?.getAttribute("src");
const cookiesAudio = document.getElementById("cookiesAudio");
const dogAudio = document.getElementById("dogAudio");
let cookiesMotionTimer = null;
let dogAudioTimer = null;

const audioVolumes = {
    master: 1,
    lp: 1,
    rain: 1,
    effects: 1,
};

const audioGroups = {
    lp: [lpAudio],
    rain: [rainAudio],
    effects: [bookAudio, cookiesAudio, dogAudio],
};

function applyAudioVolumes() {
    Object.entries(audioGroups).forEach(([group, audios]) => {
        audios.forEach((audio) => {
            if (audio) {
                audio.volume = audioVolumes.master * audioVolumes[group];
            }
        });
    });
}

function connectVolumeControl(inputId, valueId, volumeKey) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(valueId);

    if (!input || !output) {
        return;
    }

    const updateVolume = () => {
        const volume = Number(input.value);
        audioVolumes[volumeKey] = volume;
        output.value = `${Math.round(volume * 100)}%`;
        output.textContent = `${Math.round(volume * 100)}%`;
        applyAudioVolumes();
    };

    input.addEventListener("input", updateVolume);
    updateVolume();
}

connectVolumeControl("masterVolume", "masterVolumeValue", "master");
connectVolumeControl("lpVolume", "lpVolumeValue", "lp");
connectVolumeControl("rainVolume", "rainVolumeValue", "rain");
connectVolumeControl("effectsVolume", "effectsVolumeValue", "effects");

preloadFrames(coffeeEffectFrames);
preloadFrames(cookiesMotionFrames);

document.querySelectorAll(".scene-icon").forEach((icon) => {
    icon.addEventListener("pointerenter", () => icon.classList.add("is-hovered"));
    icon.addEventListener("pointerleave", () => icon.classList.remove("is-hovered"));
    icon.addEventListener("focus", () => icon.classList.add("is-hovered"));
    icon.addEventListener("blur", () => icon.classList.remove("is-hovered"));
});

function spawnCoffeeEffect() {
    const scene = document.querySelector(".scene");
    const effectImage = new Image();
    let currentFrame = 0;

    effectImage.className = "layer layer-effect";
    effectImage.alt = "";
    effectImage.src = coffeeEffectFrames[currentFrame];
    scene.append(effectImage);

    const effectTimer = window.setInterval(() => {
        currentFrame += 1;

        if (currentFrame >= coffeeEffectFrames.length) {
            window.clearInterval(effectTimer);
            effectImage.remove();
            return;
        }

        effectImage.src = coffeeEffectFrames[currentFrame];
    }, 80);
}

function playCookiesMotion() {
    if (!cookiesImage) {
        return;
    }

    if (cookiesMotionTimer !== null) {
        window.clearInterval(cookiesMotionTimer);
    }

    let currentFrame = 0;
    cookiesImage.src = cookiesMotionFrames[currentFrame];

    cookiesMotionTimer = window.setInterval(() => {
        currentFrame += 1;

        if (currentFrame >= cookiesMotionFrames.length) {
            window.clearInterval(cookiesMotionTimer);
            cookiesMotionTimer = null;
            cookiesImage.src = cookiesRestSrc;
            return;
        }

        cookiesImage.src = cookiesMotionFrames[currentFrame];
    }, 100);
}

function replaySound(audio) {
    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function replayShortDogSound() {
    if (!dogAudio) {
        return;
    }

    if (dogAudioTimer !== null) {
        window.clearTimeout(dogAudioTimer);
    }

    dogAudio.pause();
    dogAudio.currentTime = 0;
    dogAudio.play().catch(() => {});
    dogAudioTimer = window.setTimeout(() => {
        dogAudio.pause();
        dogAudio.currentTime = 0;
        dogAudioTimer = null;
    }, 900);
}

function setupHoverScaling() {
    const scene = document.querySelector(".scene");
    const targets = Array.from(scene.querySelectorAll("[data-hover-bounds]")).map((element) => ({
        element,
        hitImage: element,
        bounds: element.dataset.hoverBounds.split(",").map(Number),
    }));

    if (playButton) {
        targets.push({
            element: playButton,
            hitImage: playButton.querySelector("img"),
            bounds: playButton.dataset.hoverBounds.split(",").map(Number),
        });
    }

    const topFirstTargets = targets
        .map((target, order) => ({
            ...target,
            order,
            zIndex: Number.parseInt(getComputedStyle(target.element).zIndex, 10) || 0,
        }))
        .sort((first, second) => second.zIndex - first.zIndex || second.order - first.order);

    let hoveredTarget = null;
    let lastTouchActivationAt = 0;

    function findTargetAtPoint(clientX, clientY, minimumTouchSize = 0) {
        const sceneBounds = scene.getBoundingClientRect();
        const x = clientX - sceneBounds.left;
        const y = clientY - sceneBounds.top;

        for (const target of topFirstTargets) {
            const { hitImage } = target;
            let [left, top, width, height] = target.bounds;
            const fitScale = Math.min(
                sceneBounds.width / hitImage.naturalWidth,
                sceneBounds.height / hitImage.naturalHeight
            );
            const renderedWidth = hitImage.naturalWidth * fitScale;
            const renderedHeight = hitImage.naturalHeight * fitScale;

            if (target.element === playButton && minimumTouchSize > 0) {
                const expandedWidth = Math.max(width, minimumTouchSize / renderedWidth);
                const expandedHeight = Math.max(height, minimumTouchSize / renderedHeight);
                left -= (expandedWidth - width) / 2;
                top -= (expandedHeight - height) / 2;
                width = expandedWidth;
                height = expandedHeight;
            }

            const imageX = x - (sceneBounds.width - renderedWidth) / 2;
            const imageY = y - (sceneBounds.height - renderedHeight) / 2;

            if (imageX < 0 || imageY < 0 || imageX >= renderedWidth || imageY >= renderedHeight) {
                continue;
            }

            const normalizedX = imageX / renderedWidth;
            const normalizedY = imageY / renderedHeight;

            if (normalizedX >= left && normalizedX <= left + width
                && normalizedY >= top && normalizedY <= top + height) {
                return target;
            }
        }

        return null;
    }

    function updateHoveredTarget(target) {
        hoveredTarget = target;
        targets.forEach(({ element }) => {
            element.classList.toggle(
                "is-hovered",
                element === hoveredTarget?.element && element.classList.contains("hover-grow")
            );
        });
        scene.classList.toggle("is-over-interactive", hoveredTarget !== null);
    }

    function activateTarget(target) {
        if (!target) {
            return;
        }

        if (target.element.id === "window") {
            toggleWindowWeather();
        } else if (target.element.id === "coffee") {
            spawnCoffeeEffect();
        } else if (target.element.id === "cookies") {
            playCookiesMotion();
            replaySound(cookiesAudio);
        } else if (target.element.id === "book") {
            bookSequence?.playOnce(55);
            replaySound(bookAudio);
        } else if (target.element.id === "dogBody" || target.element.id === "eyes") {
            eyesLoop?.stop();
            eyesStare?.playOnce(70, () => eyesLoop?.start());
            dogShake?.playOnce(65, () => {
                if (dogImage) {
                    dogImage.src = dogRestSrc;
                }
            });
            replayShortDogSound();
        } else if (target.element.id === "lp") {
            selectNextLp();
        } else if (target.element === playButton) {
            toggleLpPlayback();
        }

        playLpAudio();
    }

    scene.addEventListener("pointermove", (event) => {
        updateHoveredTarget(findTargetAtPoint(event.clientX, event.clientY));
    });

    scene.addEventListener("pointerup", (event) => {
        if (event.pointerType !== "touch") {
            return;
        }

        const nativeControl = event.target.closest(
            ".scene-icon, .control-popover, input, .track-action"
        );

        if (nativeControl) {
            return;
        }

        lastTouchActivationAt = Date.now();
        activateTarget(findTargetAtPoint(event.clientX, event.clientY, 44));
    });

    scene.addEventListener("click", (event) => {
        if (event.detail > 0 && Date.now() - lastTouchActivationAt < 800) {
            return;
        }

        activateTarget(findTargetAtPoint(event.clientX, event.clientY));
    });

    scene.addEventListener("pointerleave", () => {
        hoveredTarget = null;
        scene.classList.remove("is-over-interactive");
        targets.forEach(({ element }) => element.classList.remove("is-hovered"));
    });
}

if (document.readyState === "complete") {
    setupHoverScaling();
} else {
    window.addEventListener("load", setupHoverScaling, { once: true });
}