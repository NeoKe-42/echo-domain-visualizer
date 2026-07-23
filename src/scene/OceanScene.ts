import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OceanMaterial } from './OceanMaterial';
import { ParticleField } from './ParticleField';
import type { AudioFeatures, VisualSettings } from '../types';

export class OceanScene {
  private scene=new THREE.Scene(); private camera=new THREE.PerspectiveCamera(46,1,.1,130);
  private renderer:THREE.WebGLRenderer; private composer:EffectComposer; private bloom:UnrealBloomPass;
  private material=new OceanMaterial(); private mesh:THREE.Mesh; private particles:ParticleField;
  private raf=0; private observer:ResizeObserver; private visible=true; private start=performance.now();
  private activeQuality:VisualSettings['quality'];
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private host:HTMLElement, private getAudio:()=>AudioFeatures, private getSettings:()=>VisualSettings) {
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace; host.appendChild(this.renderer.domElement);
    this.scene.background=new THREE.Color('#01040b'); this.scene.fog=new THREE.FogExp2('#020814',.018);
    this.camera.position.set(0,-15,6.2); this.camera.lookAt(0,10,-.5);
    this.activeQuality=getSettings().quality; const s=this.segments(this.activeQuality);
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(48,72,s,s),this.material); this.mesh.rotation.x=0; this.scene.add(this.mesh);
    this.particles=new ParticleField(getSettings().quality); this.scene.add(this.particles.points);
    this.composer=new EffectComposer(this.renderer); this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.32,.55,.72); this.composer.addPass(this.bloom);
    this.observer=new ResizeObserver(()=>this.resize()); this.observer.observe(host);
    document.addEventListener('visibilitychange',this.visibility); this.resize(); this.loop();
  }
  private segments(q:string){return q==='low'?90:q==='high'?220:150;}
  private visibility=()=>{this.visible=!document.hidden;if(this.visible&&!this.raf)this.loop();};
  private resize(){const {clientWidth:w,clientHeight:h}=this.host;const q=this.getSettings().quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:q==='medium'?1.5:2));this.renderer.setSize(w,h,false);this.composer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  private applyQuality(q:VisualSettings['quality']){
    if(q===this.activeQuality)return;
    this.mesh.geometry.dispose();this.mesh.geometry=new THREE.PlaneGeometry(48,72,this.segments(q),this.segments(q));
    this.scene.remove(this.particles.points);this.particles.dispose();this.particles=new ParticleField(q);this.scene.add(this.particles.points);
    this.activeQuality=q;this.resize();
  }
  private loop=()=>{
    if(!this.visible){this.raf=0;return;} this.raf=requestAnimationFrame(this.loop);
    const t=(performance.now()-this.start)/1000,s=this.getSettings(),a=this.getAudio();this.applyQuality(s.quality);
    this.material.setPalette(s.palette); this.material.update(t,a,s.intensity);
    this.particles.update(t,a,this.reduced);
    const breathe=(this.reduced||!s.autoCamera)?0:Math.sin(t*.08)*.55;
    this.camera.position.x=THREE.MathUtils.lerp(this.camera.position.x,breathe,.015);
    this.camera.position.z=THREE.MathUtils.lerp(this.camera.position.z,6.2+a.overall*.24,.025);
    this.camera.lookAt(0,10,-.5); this.bloom.enabled=s.quality!=='low';this.bloom.strength=.22+a.overall*.28;
    this.composer.render();
  };
  dispose(){cancelAnimationFrame(this.raf);this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.particles.dispose();this.mesh.geometry.dispose();this.material.dispose();this.composer.dispose();this.renderer.dispose();this.host.removeChild(this.renderer.domElement);}
}
