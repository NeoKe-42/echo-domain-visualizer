uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uBeat;
uniform float uIntensity;
varying float vHeight;
varying vec3 vWorld;
varying vec3 vNormalW;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
}
float heightAt(vec2 p){
  float t=uTime;
  float ambient=.34;
  float large=sin(p.x*.17+p.y*.10+t*.42)+.55*sin(p.x*.08-p.y*.16-t*.31);
  float medium=sin(p.x*.52+p.y*.27+t*(.65+uMid*.7))*.52+sin(-p.x*.31+p.y*.61-t*.72)*.34;
  float fine=(noise(p*1.1+t*.13)-.5)*2.0+sin(p.x*1.55-p.y*.9+t*1.3)*.2;
  float pulse=sin(length(p-vec2(0.,-4.))*1.0-t*3.2)*uBeat*exp(-length(p)*.025);
  return large*(ambient+uBass*1.7)+medium*(.15+uMid*.75)+fine*(.035+uTreble*.22)+pulse*.75;
}
void main(){
  vec3 p=position;
  float h=heightAt(p.xy)*uIntensity;
  p.z+=h;
  float e=.08;
  vec3 n=normalize(vec3(heightAt(p.xy-vec2(e,0.))-heightAt(p.xy+vec2(e,0.)),
                        heightAt(p.xy-vec2(0,e))-heightAt(p.xy+vec2(0,e)),2.0*e));
  vec4 world=modelMatrix*vec4(p,1.);
  vHeight=h; vWorld=world.xyz; vNormalW=normalize(mat3(modelMatrix)*n);
  gl_Position=projectionMatrix*viewMatrix*world;
}
