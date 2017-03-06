export const SPRITE_VERTEX = `
  precision lowp float;
  uniform vec2 uScale;
  uniform vec2 uObjScale;
  attribute vec2 aObjCen;
  attribute float aIdx;
  varying vec2 uv;
  void main(void) {
    if (aIdx == 0.0) {
      uv = vec2(0.0,0.0);
    } else if (aIdx == 1.0) {
      uv = vec2(1.0,0.0);
    } else if (aIdx == 2.0) {
      uv = vec2(0.0,1.0);
    } else {
      uv = vec2(1.0,1.0);
    }
    gl_Position = vec4(
      -1.0 + 2.0 * (aObjCen.x + uObjScale.x * (-0.5 + uv.x)) / uScale.x,
      1.0 - 2.0 * (aObjCen.y + uObjScale.y * (-0.5 + uv.y)) / uScale.y,
      0.0, 1.0
    );
  }
`;

export const SPRITE_FRAGMENT = `
  precision lowp float;
  uniform sampler2D uSampler;
  varying vec2 uv;
  void main(void) {
    gl_FragColor = texture2D(uSampler, uv);
    if (gl_FragColor.a < 0.1) discard;
  }
`;

export const GRID_VERTEX = `
  precision lowp float;
  attribute vec2 a_position;
  void main(void) {
    vec2 zeroToOne = a_position;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

export const GRID_FRAGMENT = `
  precision lowp float;
  uniform float uScale;
  void main(void) {
    float m = 8.0 * uScale;
    vec3 c = vec3(1.0, 1.0, 1.0);
    if (mod(gl_FragCoord.x, m) < 1.0 || mod(gl_FragCoord.y, m) < 1.0) {
      float g = 0.8;
      c = vec3(g, g, g);
    }
    gl_FragColor = vec4(c, 1.0);
    if (gl_FragColor.r == 1.0) discard;
  }
`;
