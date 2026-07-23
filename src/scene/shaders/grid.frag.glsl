uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorPhase;
varying float vGlow;
varying float vTone;
varying float vHeight;
varying float vTop;
void main(){
  vec3 gradient=mix(uColorA,uColorB,.12+.38*vTone+vGlow*.22);
  gradient=mix(gradient,uColorC,clamp(smoothstep(.38,1.0,vGlow)*.58+smoothstep(2.2,6.0,vHeight)*.28,0.0,.78));
  vec3 spectrumColor=.52+.48*cos(6.28318*(uColorPhase+vTone*.16+vec3(0.0,.33,.67)));
  gradient=mix(gradient,spectrumColor,.06+clamp(vGlow,0.0,1.0)*.1);
  float light=min(1.12,.16+vGlow*.48+vTop*(.52+vGlow*.42)+smoothstep(2.0,7.0,vHeight)*.1);
  gl_FragColor=vec4(gradient*light,1.0);
}
