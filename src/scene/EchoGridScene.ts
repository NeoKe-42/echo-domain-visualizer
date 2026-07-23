import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import vertexShader from './shaders/grid.vert.glsl?raw';
import fragmentShader from './shaders/grid.frag.glsl?raw';
import type { AudioFeatures, PaletteName, Quality, VisualSettings } from '../types';

const palettes:Record<PaletteName,[string,string,string]>={
  deep:['#10072d','#7143ea','#ffb36f'],
  aurora:['#062c33','#17bfa8','#d971ff'],
  lava:['#3c0308','#ff3d18','#ffc43d']
};

export class EchoGridScene {
  private scene=new THREE.Scene();private camera=new THREE.PerspectiveCamera(43,1,.1,120);
  private renderer:THREE.WebGLRenderer;private composer:EffectComposer;private bloom:UnrealBloomPass;
  private grid!:THREE.Mesh<THREE.InstancedBufferGeometry,THREE.ShaderMaterial>;private quality:Quality;
  private observer:ResizeObserver;private raf=0;private start=performance.now();private visible=true;
  private ripples=Array.from({length:8},()=>new THREE.Vector4(0,0,-100,0));private rippleCursor=0;
  private emitters=Array.from({length:4},()=>new THREE.Vector4());
  private previousBeat=0;private previousMid=0;private lastMidRipple=-10;
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private host:HTMLElement,private getAudio:()=>AudioFeatures,private getSettings:()=>VisualSettings){
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.78;
    host.appendChild(this.renderer.domElement);this.scene.background=new THREE.Color('#030617');this.scene.fog=new THREE.FogExp2('#030617',.021);
    this.camera.position.set(0,13.5,17);this.camera.lookAt(0,1,-2.5);
    this.quality=getSettings().quality;this.grid=this.createGrid(this.quality);this.scene.add(this.grid);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(45,96),new THREE.MeshBasicMaterial({color:'#02040d',transparent:true,opacity:.9}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.03;this.scene.add(floor);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.28,.48,.78);this.composer.addPass(this.bloom);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);document.addEventListener('visibilitychange',this.onVisibility);
    this.resize();this.loop();
  }
  private size(q:Quality){return q==='low'?56:q==='medium'?96:140}
  private createGrid(q:Quality){
    const n=this.size(q),span=38,step=span/n,base=new THREE.CylinderGeometry(step*.31,step*.31,1,6,1,false),geometry=new THREE.InstancedBufferGeometry();
    geometry.index=base.index;geometry.attributes.position=base.attributes.position;geometry.attributes.normal=base.attributes.normal;
    const offsets=new Float32Array(n*n*3);
    for(let z=0,i=0;z<n;z++)for(let x=0;x<n;x++,i++){offsets[i*3]=(x-(n-1)/2)*step;offsets[i*3+1]=0;offsets[i*3+2]=(z-(n-1)/2)*step}
    geometry.setAttribute('instanceOffset',new THREE.InstancedBufferAttribute(offsets,3));geometry.instanceCount=n*n;base.dispose();
    const colors=palettes[this.getSettings().palette];
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{
      uTime:{value:0},uEnergy:{value:0},uBass:{value:0},uMid:{value:0},uTreble:{value:0},uBeat:{value:0},uIntensity:{value:1},
      uSpectrum:{value:new Float32Array(64)},uRipples:{value:this.ripples},uEmitters:{value:this.emitters},uColorPhase:{value:0},uColorA:{value:new THREE.Color(colors[0])},uColorB:{value:new THREE.Color(colors[1])},uColorC:{value:new THREE.Color(colors[2])}
    }});
    return new THREE.Mesh(geometry,material);
  }
  private resize(){const {clientWidth:w,clientHeight:h}=this.host,q=this.getSettings().quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:q==='medium'?1.5:1.8));this.renderer.setSize(w,h,false);this.composer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
  private onVisibility=()=>{this.visible=!document.hidden;if(this.visible&&!this.raf)this.loop()};
  private loop=()=>{if(!this.visible){this.raf=0;return}this.raf=requestAnimationFrame(this.loop);
    const t=(performance.now()-this.start)/1000,a=this.getAudio(),s=this.getSettings();
    if(s.quality!==this.quality){this.scene.remove(this.grid);this.grid.geometry.dispose();this.grid.material.dispose();this.quality=s.quality;this.grid=this.createGrid(s.quality);this.scene.add(this.grid);this.resize()}
    const beatEdge=a.beat>.72&&this.previousBeat<=.72;
    const midEdge=a.mid>.2&&a.mid>this.previousMid*1.28&&t-this.lastMidRipple>.42;
    this.emitters[0].set(Math.sin(t*.11)*7-3,Math.cos(t*.083)*6,a.bass*.95+a.overall*.15,0);
    this.emitters[1].set(Math.cos(t*.073)*8+3,Math.sin(t*.097)*7,a.mid*.82,1);
    this.emitters[2].set(Math.sin(t*.057+2.1)*10,Math.cos(t*.069+1.2)*7,a.treble*.62,2);
    this.emitters[3].set(Math.cos(t*.045+3.2)*5,Math.sin(t*.052+2.4)*5,a.overall*.72,3);
    if(beatEdge||midEdge){const source=beatEdge?this.emitters[0]:this.emitters[1];this.ripples[this.rippleCursor].set(source.x,source.y,t,beatEdge ? .88 : .48);this.rippleCursor=(this.rippleCursor+1)%this.ripples.length;if(midEdge)this.lastMidRipple=t}
    this.previousBeat=a.beat;this.previousMid=a.mid;
    const u=this.grid.material.uniforms;u.uTime.value=t;u.uEnergy.value=a.overall;u.uBass.value=a.bass;u.uMid.value=a.mid;u.uTreble.value=a.treble;u.uBeat.value=a.beat;u.uIntensity.value=s.intensity;u.uSpectrum.value=a.spectrum;u.uRipples.value=this.ripples;u.uEmitters.value=this.emitters;u.uColorPhase.value=(t*.018+a.overall*.04)%1;
    const c=palettes[s.palette];(u.uColorA.value as THREE.Color).lerp(new THREE.Color(c[0]),.025);(u.uColorB.value as THREE.Color).lerp(new THREE.Color(c[1]),.025);(u.uColorC.value as THREE.Color).lerp(new THREE.Color(c[2]),.025);
    if(s.autoCamera&&!this.reduced){const angle=t*.025;this.camera.position.x=Math.sin(angle)*2.8;this.camera.position.y=13.5+Math.sin(t*.07)*.5;this.camera.position.z=17+Math.cos(angle)*1.2;this.camera.lookAt(0,1,-2.5)}
    this.bloom.enabled=s.quality!=='low';this.bloom.strength=.24+Math.min(.16,a.treble*.16);this.composer.render();
  };
  dispose(){cancelAnimationFrame(this.raf);this.observer.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.grid.geometry.dispose();this.grid.material.dispose();this.composer.dispose();this.renderer.dispose();this.host.removeChild(this.renderer.domElement)}
}
