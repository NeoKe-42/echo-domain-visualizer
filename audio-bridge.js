import project from './wallpaper-properties.json';

(() => {
  // Browsers retain final control over adapter selection, but this upgrades every
  // WebGL context request made by the original wallpaper to a high-performance hint.
  const nativeGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, attributes) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return nativeGetContext.call(this, type, {
        ...attributes,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      });
    }
    return nativeGetContext.call(this, type, attributes);
  };

  let audioListener = null;
  let stream = null;
  let context = null;
  let source = null;
  let splitter = null;
  let leftAnalyser = null;
  let rightAnalyser = null;
  let animationFrame = 0;
  const leftSpectrum = new Uint8Array(1024);
  const rightSpectrum = new Uint8Array(1024);
  const wallpaperSpectrum = new Float32Array(128);

  window.wallpaperRegisterAudioListener = (listener) => {
    audioListener = listener;
  };

  const storageKey = 'sonic-topography-browser-settings-v1';
  const propertyDefinitions = project.general.properties;
  const editableKeys = [
    'theme', 'themeCycleInterval', 'audioIntensity', 'responseRange',
    'pulseEnabled', 'pulseSensitivity', 'pulseCooldown',
    'meteorEnabled', 'meteorSensitivity', 'meteorCooldown', 'meteorClickEnabled',
    'idleWaveEnabled', 'idleWaveDebounce', 'idleWaveFadeDuration',
    'peakColorEnabled', 'peakColorIntensity',
    'cameraDistance', 'cameraAngleX', 'cameraAngleY', 'autoRotateEnabled', 'autoRotateSpeed',
    'gridSize', 'showPlayerController', 'showAlbumCover', 'controllerSize', 'controllerX', 'controllerY',
  ];
  const groups = [
    ['主题与颜色', ['theme', 'themeCycleInterval', 'peakColorEnabled', 'peakColorIntensity']],
    ['音频响应', ['audioIntensity', 'responseRange']],
    ['波纹', ['pulseEnabled', 'pulseSensitivity', 'pulseCooldown']],
    ['流星与粒子', ['meteorEnabled', 'meteorSensitivity', 'meteorCooldown', 'meteorClickEnabled']],
    ['空闲动画', ['idleWaveEnabled', 'idleWaveDebounce', 'idleWaveFadeDuration']],
    ['相机', ['cameraDistance', 'cameraAngleX', 'cameraAngleY', 'autoRotateEnabled', 'autoRotateSpeed']],
    ['渲染', ['gridSize']],
    ['播放器卡片', ['showPlayerController', 'showAlbumCover', 'controllerSize', 'controllerX', 'controllerY']],
  ];
  const defaults = Object.fromEntries(editableKeys.map((key) => [key, propertyDefinitions[key].value]));
  let settings = { ...defaults };
  try {
    settings = { ...settings, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
  } catch {
    localStorage.removeItem(storageKey);
  }

  const sendProperties = (values) => {
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value }]));
    window.wallpaperPropertyListener?.applyUserProperties?.(payload);
  };

  const waitForWallpaper = () => {
    if (window.wallpaperPropertyListener?.applyUserProperties) {
      sendProperties(settings);
      return;
    }
    setTimeout(waitForWallpaper, 50);
  };

  const createSettingsPanel = () => {
    const panel = document.getElementById('browser-settings-panel');
    const body = document.getElementById('browser-settings-body');
    const toggle = document.getElementById('browser-settings-toggle');
    const close = document.getElementById('browser-settings-close');
    const reset = document.getElementById('browser-settings-reset');

    const updateProperty = (key, value) => {
      settings[key] = value;
      localStorage.setItem(storageKey, JSON.stringify(settings));
      sendProperties({ [key]: value });
    };

    for (const [title, keys] of groups) {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = title;
      section.appendChild(heading);
      for (const key of keys) {
        const definition = propertyDefinitions[key];
        const row = document.createElement('label');
        row.className = 'browser-setting-row';
        const caption = document.createElement('span');
        caption.textContent = definition.text.split('/')[0].trim();
        row.appendChild(caption);

        if (definition.type === 'bool') {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = Boolean(settings[key]);
          input.addEventListener('change', () => updateProperty(key, input.checked));
          row.appendChild(input);
        } else if (definition.type === 'combo') {
          const select = document.createElement('select');
          for (const option of definition.options) {
            const item = document.createElement('option');
            item.value = String(option.value);
            item.textContent = option.label.split('/')[0].trim();
            item.selected = String(settings[key]) === String(option.value);
            select.appendChild(item);
          }
          select.addEventListener('change', () => {
            const original = definition.options.find((option) => String(option.value) === select.value)?.value;
            updateProperty(key, original ?? select.value);
          });
          row.appendChild(select);
        } else {
          const control = document.createElement('div');
          control.className = 'browser-range-control';
          const output = document.createElement('output');
          output.textContent = String(settings[key]);
          const input = document.createElement('input');
          input.type = 'range';
          input.min = String(definition.min);
          input.max = String(definition.max);
          input.step = String(definition.step);
          input.value = String(settings[key]);
          input.addEventListener('input', () => {
            output.textContent = input.value;
            updateProperty(key, Number(input.value));
          });
          control.append(input, output);
          row.appendChild(control);
        }
        section.appendChild(row);
      }
      body.appendChild(section);
    }

    toggle.addEventListener('click', () => panel.classList.add('is-open'));
    close.addEventListener('click', () => panel.classList.remove('is-open'));
    reset.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      sendProperties(defaults);
      window.location.reload();
    });

    const reportRenderer = () => {
      const canvas = document.querySelector('#root canvas');
      const gpuLabel = document.getElementById('browser-gpu-renderer');
      if (!canvas || !gpuLabel) {
        setTimeout(reportRenderer, 500);
        return;
      }
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const extension = gl?.getExtension('WEBGL_debug_renderer_info');
      const renderer = extension
        ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
        : gl?.getParameter(gl.RENDERER);
      gpuLabel.textContent = renderer ? `GPU · ${renderer}` : 'GPU · 浏览器未公开';
      gpuLabel.title = 'GPU 由浏览器和操作系统最终选择';
    };
    setTimeout(reportRenderer, 800);
  };

  const stop = () => {
    cancelAnimationFrame(animationFrame);
    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    source?.disconnect();
    splitter?.disconnect();
    leftAnalyser?.disconnect();
    rightAnalyser?.disconnect();
    void context?.close();
    stream = null;
    context = null;
    source = null;
    splitter = null;
    leftAnalyser = null;
    rightAnalyser = null;
    wallpaperSpectrum.fill(0);
    audioListener?.(wallpaperSpectrum);
    document.getElementById('browser-audio-bridge')?.classList.remove('is-connected');
  };

  const requestReconnect = (message) => {
    if (!stream) return;
    const panel = document.getElementById('browser-audio-bridge');
    const error = document.getElementById('browser-audio-error');
    const button = document.getElementById('browser-audio-connect');
    panel?.classList.remove('is-connected');
    if (error) error.textContent = message;
    if (button) button.textContent = '重新连接系统音频';
  };

  const sampleLogBand = (band, sampleRate, spectrum, analyserNode) => {
    const minimumHz = 20;
    const maximumHz = 12000;
    const startHz = minimumHz * Math.pow(maximumHz / minimumHz, band / 64);
    const endHz = minimumHz * Math.pow(maximumHz / minimumHz, (band + 1) / 64);
    const hzPerBin = sampleRate / analyserNode.fftSize;
    const start = Math.max(0, Math.floor(startHz / hzPerBin));
    const end = Math.min(spectrum.length - 1, Math.max(start, Math.ceil(endHz / hzPerBin)));
    let sum = 0;
    for (let index = start; index <= end; index++) sum += spectrum[index];
    return Math.min(1.15, (sum / Math.max(1, end - start + 1) / 255) * 1.45);
  };

  const update = () => {
    if (!leftAnalyser || !rightAnalyser || !context) return;
    leftAnalyser.getByteFrequencyData(leftSpectrum);
    rightAnalyser.getByteFrequencyData(rightSpectrum);
    let rightSignal = 0;
    for (let index = 0; index < rightSpectrum.length; index += 16) rightSignal += rightSpectrum[index];
    const useMonoFallback = rightSignal < 2;
    for (let band = 0; band < 64; band++) {
      const left = sampleLogBand(band, context.sampleRate, leftSpectrum, leftAnalyser);
      const right = useMonoFallback
        ? left
        : sampleLogBand(band, context.sampleRate, rightSpectrum, rightAnalyser);
      wallpaperSpectrum[band] += (left - wallpaperSpectrum[band]) * (left > wallpaperSpectrum[band] ? .42 : .13);
      wallpaperSpectrum[band + 64] += (right - wallpaperSpectrum[band + 64]) * (right > wallpaperSpectrum[band + 64] ? .42 : .13);
    }
    audioListener?.(wallpaperSpectrum);
    animationFrame = requestAnimationFrame(update);
  };

  const connect = async () => {
    const panel = document.getElementById('browser-audio-bridge');
    const error = document.getElementById('browser-audio-error');
    const button = document.getElementById('browser-audio-connect');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      error.textContent = '当前浏览器不支持系统音频共享，请使用最新版 Chrome 或 Edge。';
      return;
    }
    try {
      if (stream) stop();
      error.textContent = '';
      button.textContent = '共享系统音频';
      button.disabled = true;
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: { suppressLocalAudioPlayback: false },
        systemAudio: 'include',
        windowAudio: 'system',
        monitorTypeSurfaces: 'include',
        selfBrowserSurface: 'exclude',
      });
      if (!stream.getAudioTracks().length) throw new Error('没有检测到音轨，请重新共享并勾选“共享系统音频”。');
      context = new AudioContext();
      await context.resume();
      source = context.createMediaStreamSource(stream);
      splitter = context.createChannelSplitter(2);
      leftAnalyser = context.createAnalyser();
      rightAnalyser = context.createAnalyser();
      for (const analyserNode of [leftAnalyser, rightAnalyser]) {
        analyserNode.fftSize = 2048;
        analyserNode.smoothingTimeConstant = .36;
        analyserNode.minDecibels = -92;
        analyserNode.maxDecibels = -12;
      }
      source.connect(splitter);
      splitter.connect(leftAnalyser, 0);
      splitter.connect(rightAnalyser, 1);
      stream.getTracks().forEach((track) => { track.onended = stop; });
      stream.getAudioTracks().forEach((track) => {
        track.onmute = () => requestReconnect('系统音频已静音。若刚切换到蓝牙耳机，请重新连接。');
      });
      panel.classList.add('is-connected');
      update();
    } catch (caught) {
      stop();
      error.textContent = caught instanceof Error ? caught.message : '系统音频共享已取消。';
    } finally {
      button.disabled = false;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('browser-audio-connect')?.addEventListener('click', connect);
    createSettingsPanel();
    waitForWallpaper();
  });
  navigator.mediaDevices?.addEventListener?.('devicechange', () => {
    requestReconnect('检测到音频设备变化。蓝牙耳机连接后需要重新共享系统音频。');
  });
  window.addEventListener('beforeunload', stop);
})();
