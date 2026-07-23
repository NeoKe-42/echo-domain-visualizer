import * as THREE from 'three';
import type { AudioFeatures, Quality } from '../types';

export class ParticleField {
  points: THREE.Points;
  private base: Float32Array;
  private count = 0;
  constructor(quality: Quality) {
    this.count = quality === 'low' ? 90 : quality === 'medium' ? 240 : 420;
    this.base = new Float32Array(this.count * 3);
    for (let i=0;i<this.count;i++) {
      this.base[i*3]=(Math.random()-.5)*38; this.base[i*3+1]=(Math.random()-.5)*55;
      this.base[i*3+2]=.45+Math.random()*3.8;
    }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(this.base.slice(),3));
    const mat=new THREE.PointsMaterial({color:'#77eaff',size:.045,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending});
    this.points=new THREE.Points(geo,mat);
  }
  update(t:number,a:AudioFeatures,reduced:boolean){
    const pos=this.points.geometry.attributes.position.array as Float32Array;
    const movement=reduced?.15:1;
    for(let i=0;i<this.count;i++){
      pos[i*3]=this.base[i*3]+Math.sin(t*.25+i)*(.08+a.beat*.38)*movement;
      pos[i*3+1]=this.base[i*3+1]+((t*(.10+a.treble*.22)+i*.1)%2);
      pos[i*3+2]=this.base[i*3+2]+Math.sin(t*.5+i*1.7)*(.08+a.treble*.3)*movement;
    }
    this.points.geometry.attributes.position.needsUpdate=true;
    const mat=this.points.material as THREE.PointsMaterial; mat.opacity=.18+a.treble*.48; mat.size=.035+a.treble*.075;
  }
  dispose(){this.points.geometry.dispose();(this.points.material as THREE.Material).dispose();}
}
