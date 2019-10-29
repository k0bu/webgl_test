#version 300 es

in vec3 vertexPosition;
in vec2 texCoord;
uniform mat4 mvpMatrix;

out vec2 textureCoord;

void main() {
  textureCoord = texCoord;
  gl_Position = mvpMatrix * vec4(vertexPosition, 1.0) ;
}