#version 300 es
precision highp float;

uniform sampler2D texture0;
uniform sampler2D texture1;
in vec2 textureCoord;
out vec4 fragmentColor;

void main() {
  vec4 smpColor0 = texture(texture0, textureCoord);
  vec4 smpColor1 = texture(texture1, textureCoord);
  fragmentColor = smpColor0 * smpColor1;
}
