uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uBeat;
uniform float uIntensity;
uniform float uSpectrum[64];
uniform vec4 uRipples[8];
uniform vec4 uEmitters[4];
attribute vec3 instanceOffset;
varying float vGlow;
varying float vTone;
varying float vHeight;
varying float vTop;

void main(){
  float distanceFromCenter=length(instanceOffset.xz);
  float fieldBand=fract((instanceOffset.x+19.0)/38.0+sin(instanceOffset.z*.17)*.085);
  int band=int(floor(clamp(fieldBand,0.0,.999)*64.0));
  float fft=uSpectrum[band];
  float idle=(sin(instanceOffset.x*.31+uTime*.55)+sin(instanceOffset.z*.27-uTime*.38))*.5+.5;
  float ripple=0.0;
  for(int i=0;i<8;i++){
    float age=max(0.0,uTime-uRipples[i].z);
    float radius=age*(3.8+uRipples[i].w*.8);
    float d=length(instanceOffset.xz-uRipples[i].xy);
    float ring=exp(-pow((d-radius)*1.65,2.0))*exp(-age*.34)*uRipples[i].w;
    float wake=exp(-d*.16)*exp(-age*1.5)*uRipples[i].w*.35;
    ripple+=ring+wake;
  }
  float energyField=0.0;
  float ringField=0.0;
  for(int i=0;i<4;i++){
    float d=length(instanceOffset.xz-uEmitters[i].xy);
    float strength=uEmitters[i].z;
    float core=exp(-d*d/(13.0+strength*24.0));
    float rimRadius=2.3+strength*4.8;
    float rim=exp(-pow((d-rimRadius)*.72,2.0));
    energyField+=core*strength;
    ringField+=rim*strength;
  }
  float spatial=.58+.42*(.5+.5*sin(instanceOffset.z*.22+float(band)*.09+uTime*.34));
  float flow=(sin(instanceOffset.x*.22+instanceOffset.z*.13-uTime*.42)+sin(instanceOffset.x*.11-instanceOffset.z*.28+uTime*.3))*.5;
  float detail=fft*(.35+energyField*1.15)*spatial;
  float h=.055+idle*.055+(detail*2.7+energyField*3.7+ringField*2.5+uMid*.16*max(flow,0.0)+ripple*4.2)*uIntensity;
  vec3 p=position;
  p.y=p.y*h+h*.5;
  vec3 worldOffset=instanceOffset;
  vGlow=clamp(fft*.26+energyField*.58+ringField*.48+ripple*.68+uTreble*.08,0.0,1.0);
  vTone=.5+.5*sin(fieldBand*5.0-uTime*.22+uEnergy*.45);
  vHeight=h;
  vTop=max(normal.y,0.0);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p+worldOffset,1.0);
}
