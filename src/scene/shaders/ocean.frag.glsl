uniform vec3 uDeep;
uniform vec3 uMidColor;
uniform vec3 uPeak;
uniform float uEnergy;
uniform float uTreble;
varying float vHeight;
varying vec3 vWorld;
varying vec3 vNormalW;
void main(){
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float fresnel=pow(1.-max(dot(viewDir,vNormalW),0.),2.4);
  float light=max(dot(vNormalW,normalize(vec3(-.35,.45,.82))),0.);
  float crest=smoothstep(.15,1.55,vHeight)*(0.45+uTreble);
  vec3 col=mix(uDeep,uMidColor,smoothstep(-1.5,.65,vHeight)*.64+light*.22);
  col=mix(col,uPeak,clamp(fresnel*.48+crest*.65,0.,.9));
  col+=uPeak*(crest*.22+uEnergy*.08);
  float fog=smoothstep(14.,52.,length(vWorld-cameraPosition));
  col=mix(col,uDeep*.3,fog*.7);
  gl_FragColor=vec4(col,1.);
}
