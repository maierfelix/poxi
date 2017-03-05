export const GRID_VT = `
     precision lowp float;
       attribute vec2 aVertexPosition;
       attribute vec2 aTextureCoord;
       attribute vec4 aColor;
      uniform mat3 projectionMatrix;
       varying vec2 vTextureCoord;
       varying vec4 vColor;
       uniform float red;
       void main(void){
           gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
           vTextureCoord = aTextureCoord;
           if (aColor.a >= 1.0) {
               vColor = vec4(0.0, 1.0, 0.0, 1.0);
          }
          else {
               vColor = vec4(1.0, 0.0, 0.0, 1.0);
           }
      }
`;

export const GRID_FS = `
 precision lowp float;
     varying vec2 vTextureCoord;
     varying vec4 vColor;
     uniform sampler2D uSampler;
     void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor ;
    }
`;